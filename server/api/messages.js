const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const allowCors = require('./allowCors');

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

// Enhanced JWT verification with better error handling
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

// Parse request body
const parseBody = async (req) => {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        console.error('Error parsing request body:', e);
        resolve({});
      }
    });
  });
};

async function handler(req, res) {
  console.log('Messages API called with method:', req.method);
  console.log('URL:', req.url);

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Get token from authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // Verify token
    const { user, error } = await verifyToken(token);
    
    if (error) {
      return res.status(401).json({ message: error });
    }

    // POST - Send a new message
    if (req.method === 'POST') {
      const body = await parseBody(req);
      console.log('Received message data:', body);
      
      const { chatId, content, type = 'text', replyTo } = body;
      
      if (!chatId || !content) {
        return res.status(400).json({ message: 'Chat ID and content are required' });
      }
      
      if (content.length > 2000) {
        return res.status(400).json({ message: 'Message content cannot exceed 2000 characters' });
      }

      // Connect to database
      const db = await connectToDatabase();

      // Check if chat exists
      const chat = await db.collection('chats').findOne({ 
        _id: new ObjectId(chatId) 
      });
      
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

      // Check reply message if provided
      if (replyTo) {
        const replyMessage = await db.collection('messages').findOne({
          _id: new ObjectId(replyTo),
          chat: new ObjectId(chatId)
        });
        
        if (!replyMessage) {
          return res.status(400).json({ message: 'Invalid reply message' });
        }
      }

      // Create new message
      const message = {
        content,
        type: type || 'text',
        sender: user._id,
        chat: new ObjectId(chatId),
        createdAt: new Date(),
        updatedAt: new Date(),
        readBy: [],
        reactions: [],
        edited: {
          isEdited: false
        },
        deleted: {
          isDeleted: false
        }
      };
      
      if (replyTo) {
        message.replyTo = new ObjectId(replyTo);
      }

      // Insert message
      const result = await db.collection('messages').insertOne(message);
      console.log('Message created with ID:', result.insertedId);
      
      // Update chat's last activity
      await db.collection('chats').updateOne(
        { _id: new ObjectId(chatId) },
        { 
          $set: { 
            lastMessage: result.insertedId,
            lastActivity: new Date()
          } 
        }
      );

      // Return populated message
      message._id = result.insertedId;
      message.sender = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      };

      return res.status(201).json({
        message: 'Message sent successfully',
        data: message
      });
    } else {
      return res.status(405).json({ message: 'Method not allowed. Use POST to send messages.' });
    }
  } catch (error) {
    console.error('Messages API error:', error);
    return res.status(500).json({ 
      message: 'Server error processing request',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
}

module.exports = allowCors(handler);
