const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// MongoDB connection with connection pooling
let cachedDb = null;
const connectToDatabase = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Database connection failed');
  }
};

// JWT verification function
const verifyUserToken = async (token) => {
  if (!token) {
    return { error: 'No token provided' };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return { error: 'User not found' };
    }
    
    return { user };
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return { error: 'Invalid token' };
    }
    
    if (error.name === 'TokenExpiredError') {
      return { error: 'Token has expired' };
    }
    
    return { error: 'Authentication failed' };
  }
};

// CORS middleware
const allowCors = (fn) => async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Call the original handler
  return await fn(req, res);
};

async function handler(req, res) {
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('Token received:', token ? 'Yes' : 'No');
    
    // Verify token with better error handling
    const { user, error } = await verifyUserToken(token);
    
    if (error) {
      console.log('Authentication error:', error);
      return res.status(401).json({ message: error });
    }

    console.log('Authenticated user:', user.name);

    // Extract chat ID from URL path
    let chatId;
    const pathParts = req.url.split('/').filter(part => part);
    
    // Look for chatId at the end of the path
    chatId = pathParts[pathParts.length - 1];
    
    // Remove query parameters if present
    if (chatId && chatId.includes('?')) {
      chatId = chatId.split('?')[0];
    }
    
    console.log('Extracted chatId:', chatId);
    
    if (!chatId || chatId === 'api' || chatId === 'messages') {
      return res.status(400).json({ message: 'Missing chat ID' });
    }

    // Parse query parameters
    let page = 1;
    let limit = 50;
    
    if (req.query) {
      if (req.query.page) {
        page = parseInt(req.query.page);
      }
      if (req.query.limit) {
        limit = parseInt(req.query.limit);
      }
    } else if (req.url.includes('?')) {
      // Parse URL params manually
      const queryString = req.url.split('?')[1];
      const params = new URLSearchParams(queryString);
      
      if (params.has('page')) {
        page = parseInt(params.get('page'));
      }
      
      if (params.has('limit')) {
        limit = parseInt(params.get('limit'));
      }
    }
    
    // Validate parameters
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      limit = 50;
    }

    console.log('Fetching messages for chat:', chatId);
    console.log('Pagination:', { page, limit });

    // Connect to database
    const db = await connectToDatabase();

    // Check if chat exists
    const chat = await db.collection('chats').findOne({ 
      _id: new ObjectId(chatId) 
    });
    
    if (!chat) {
      console.log('Chat not found:', chatId);
      return res.status(404).json({ message: 'Chat not found' });
    }

    console.log('Chat found:', chat.type);

    // Check if user is participant
    const isParticipant = chat.participants.some(p => {
      const participantId = p.user.toString();
      const userId = user._id.toString();
      const matches = participantId === userId;
      console.log(`Comparing: ${participantId} vs ${userId} = ${matches}`);
      return matches;
    });
    
    if (!isParticipant) {
      console.log('Access denied: User is not a participant');
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('User is a participant, retrieving messages');

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get messages with minimal populating
    const messages = await db.collection('messages')
      .find({
        chat: new ObjectId(chatId),
        'deleted.isDeleted': { $ne: true }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log('Messages found:', messages.length);

    // Basic populate of sender info
    for (const message of messages) {
      if (message.sender) {
        try {
          const sender = await db.collection('users').findOne(
            { _id: new ObjectId(message.sender) },
            { projection: { name: 1, email: 1, avatar: 1 } }
          );
          message.sender = sender || { _id: message.sender, name: 'Unknown User' };
        } catch (err) {
          console.error('Error fetching sender:', err);
          message.sender = { _id: message.sender, name: 'Unknown User' };
        }
      }
    }

    // Send response
    messages.reverse(); // oldest first for display
    
    return res.status(200).json({
      messages,
      pagination: {
        current: page,
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    console.error('Messages API error:', error);
    return res.status(500).json({
      message: 'Server error processing request',
      error: error.toString()
    });
  }
}

module.exports = allowCors(handler);
