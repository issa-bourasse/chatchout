const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const allowCors = require('../allowCors');

// MongoDB connection
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

// JWT verification with better error handling
const verifyToken = async (token) => {
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

async function handler(req, res) {
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Allow only GET for this endpoint
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // Verify token
    const { user, error } = await verifyToken(token);
    
    if (error) {
      return res.status(401).json({ message: error });
    }

    // Extract chat ID from path
    const parts = req.url.split('/');
    let chatId = parts[parts.length - 1];
    
    // Remove query parameters if present
    if (chatId.includes('?')) {
      chatId = chatId.split('?')[0];
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
      // Parse URL params manually if needed
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

    // Connect to database
    const db = await connectToDatabase();

    // Check if chat exists
    const chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId) });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(p => 
      p.user.toString() === user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

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

    // Basic populate of sender info
    for (const message of messages) {
      if (message.sender) {
        const sender = await db.collection('users').findOne(
          { _id: new ObjectId(message.sender) },
          { projection: { name: 1, email: 1, avatar: 1 } }
        );
        message.sender = sender || { _id: message.sender, name: 'Unknown User' };
      }
    }

    // Send response
    messages.reverse(); // oldest first
    
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
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
}

module.exports = allowCors(handler);
