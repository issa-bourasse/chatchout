const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const allowCors = require('./allowCors');

// Connect to MongoDB
const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  return client.db();
};

// Verify JWT token and get user
const verifyToken = async (token) => {
  try {
    if (!token) {
      return null;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get database connection
    const db = await connectToDatabase();
    
    // Get user from database
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    );
    
    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

async function handler(req, res) {
  // Allow only GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;

    // Verify token and get user
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    // Get chat ID from URL - path format is /api/messages/:chatId
    const chatId = req.url.split('/').pop().split('?')[0];
    
    // Get query parameters
    const url = new URL(req.url, `https://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    // Validate parameters
    if (isNaN(page) || page < 1) {
      return res.status(400).json({ message: 'Page must be a positive integer' });
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ message: 'Limit must be between 1 and 100' });
    }

    // Connect to database
    const db = await connectToDatabase();

    // Check if chat exists and user is participant
    const chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId) });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant in the chat
    const isParticipant = chat.participants.some(
      p => p.user.toString() === user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get messages
    const messages = await db.collection('messages')
      .find({
        chat: new ObjectId(chatId),
        'deleted.isDeleted': false
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Populate sender details for each message
    const populatedMessages = await Promise.all(messages.map(async (message) => {
      // Populate sender
      if (message.sender) {
        const sender = await db.collection('users').findOne(
          { _id: new ObjectId(message.sender) },
          { projection: { name: 1, email: 1, avatar: 1 } }
        );
        message.sender = sender;
      }

      // Populate reply message if exists
      if (message.replyTo) {
        const replyMessage = await db.collection('messages').findOne(
          { _id: new ObjectId(message.replyTo) },
          { projection: { content: 1, sender: 1, type: 1 } }
        );
        
        if (replyMessage && replyMessage.sender) {
          const replySender = await db.collection('users').findOne(
            { _id: new ObjectId(replyMessage.sender) },
            { projection: { name: 1 } }
          );
          replyMessage.sender = replySender;
        }
        
        message.replyTo = replyMessage;
      }

      return message;
    }));

    // Reverse to get chronological order (oldest first)
    populatedMessages.reverse();

    res.status(200).json({
      messages: populatedMessages,
      pagination: {
        current: page,
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      message: 'Server error getting messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = allowCors(handler);
