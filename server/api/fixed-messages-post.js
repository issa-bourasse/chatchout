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

// Parse JSON body
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
        console.error('Error parsing JSON:', e);
        resolve({});
      }
    });
  });
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
  console.log('Messages API called with method:', req.method);
  console.log('URL:', req.url);

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Get token from authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('Token received:', token ? 'Yes' : 'No');
    
    // Verify token
    const { user, error } = await verifyUserToken(token);
    
    if (error) {
      console.log('Authentication error:', error);
      return res.status(401).json({ message: error });
    }

    console.log('Authenticated user:', user.name);

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

      console.log('Creating message for chat:', chatId);

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

      console.log('User is a participant, creating message');

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
      error: error.toString()
    });
  }
}

module.exports = allowCors(handler);
