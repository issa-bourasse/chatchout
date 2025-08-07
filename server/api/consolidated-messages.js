// Consolidated API handler for messages
const allowCors = require('./allowCors');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const auth = require('./auth-middleware-new');
require('dotenv').config();

// Helper function to verify token and get user
async function verifyToken(req) {
  try {
    const authResult = await auth(req, { 
      status: () => ({ json: () => ({}) }) 
    });
    return authResult.success ? authResult.user : null;
  } catch (error) {
    console.error('[MessagesAPI] Auth error:', error);
    return null;
  }
}

// Connect to MongoDB if not already connected
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('[MessagesAPI] MongoDB connected');
  } catch (err) {
    console.error('[MessagesAPI] MongoDB connection error:', err);
    throw err;
  }
}

// Helper to parse JSON body for serverless functions
async function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body) {
      // Body already parsed (e.g. by express)
      return resolve(req.body);
    }
    
    // For serverless functions that don't use express
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsedBody = body ? JSON.parse(body) : {};
        req.body = parsedBody;
        resolve(parsedBody);
      } catch (e) {
        console.error('[MessagesAPI] Error parsing request body:', e);
        req.body = {};
        resolve({});
      }
    });
  });
}

/**
 * Combined Message API handler for multiple endpoints
 */
async function handler(req, res) {
  // Extract the endpoint path and chatId from the URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const chatId = path.split('/').pop();
  
  console.log(`[MessagesAPI] Request received for path: ${path}, method: ${req.method}`);
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Parse request body if needed
    if (req.method === 'POST' || req.method === 'PUT') {
      await parseBody(req);
      console.log(`[MessagesAPI] Request body:`, req.body);
    }
    
    // Connect to database first (common for all handlers)
    await connectDB();
    
    // Route to appropriate handler based on path and method
    if (path.endsWith('/messages') && req.method === 'POST') {
      return await handleSendMessage(req, res);
    } else if (path.match(/\/messages\/[a-zA-Z0-9]+$/) && req.method === 'GET') {
      return await handleGetMessages(req, res, chatId);
    } else {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found'
      });
    }
  } catch (error) {
    console.error(`[MessagesAPI] Error in ${path}:`, error);
    return res.status(500).json({
      success: false,
      message: `Server error processing ${path}`,
      error: error.message
    });
  }
}

/**
 * Handle GET request to retrieve messages for a chat
 */
async function handleGetMessages(req, res, chatId) {
  try {
    // Authenticate user
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    console.log(`[MessagesAPI] Getting messages for chat ${chatId}, page ${page}, limit ${limit}`);
    
    // Check if chat exists and user is participant
    const chat = await Chat.findOne({
      _id: chatId,
      'participants.user': user._id
    });
    
    if (!chat) {
      return res.status(403).json({
        error: 'Chat not found or access denied'
      });
    }
    
    // Find messages
    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email avatar')
      .populate('replyTo')
      .lean();
    
    console.log(`[MessagesAPI] Found ${messages.length} messages`);
    
    // Format messages for consistent ID handling
    const formattedMessages = messages.map(msg => ({
      ...msg,
      sender: msg.sender ? {
        ...msg.sender,
        id: msg.sender._id
      } : null
    }));
    
    return res.status(200).json({
      messages: formattedMessages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    console.error('[MessagesAPI] Get messages error:', error);
    return res.status(500).json({
      error: 'Error retrieving messages: ' + error.message
    });
  }
}

/**
 * Handle POST request to send a new message
 */
async function handleSendMessage(req, res) {
  try {
    // Authenticate user
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { chatId, content, type = 'text', replyTo = null } = req.body;
    
    console.log(`[MessagesAPI] Sending message to chat ${chatId}`);
    
    // Validate required fields
    if (!chatId || !content) {
      return res.status(400).json({
        error: 'Chat ID and content are required'
      });
    }
    
    // Check if chat exists and user is participant
    const chat = await Chat.findOne({
      _id: chatId,
      'participants.user': user._id
    });
    
    if (!chat) {
      return res.status(403).json({
        error: 'Chat not found or access denied'
      });
    }
    
    // Create and save the new message
    const message = new Message({
      content,
      type,
      sender: user._id,
      chat: chatId,
      replyTo: replyTo ? new ObjectId(replyTo) : null
    });
    
    await message.save();
    
    // Update chat's lastMessage and lastActivity
    chat.lastMessage = message._id;
    chat.lastActivity = new Date();
    await chat.save();
    
    // Populate the new message
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('replyTo')
      .lean();
    
    // Format the message for consistent ID handling
    const formattedMessage = {
      ...populatedMessage,
      sender: {
        ...populatedMessage.sender,
        id: populatedMessage.sender._id
      }
    };
    
    console.log('[MessagesAPI] Message sent:', message._id);
    
    return res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('[MessagesAPI] Send message error:', error);
    return res.status(500).json({
      error: 'Error sending message: ' + error.message
    });
  }
}

module.exports = allowCors(handler);
