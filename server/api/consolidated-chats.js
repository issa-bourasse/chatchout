// Consolidated API handler for chat operations
const allowCors = require('./allowCors');
const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const User = require('../models/User');
const auth = require('./auth-middleware-new');
require('dotenv').config();

// Connect to MongoDB if not already connected
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('[ChatsAPI] MongoDB connected');
  } catch (err) {
    console.error('[ChatsAPI] MongoDB connection error:', err);
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
        console.error('[ChatsAPI] Error parsing request body:', e);
        req.body = {};
        resolve({});
      }
    });
  });
}

/**
 * Combined Chat API handler for multiple endpoints
 */
async function handler(req, res) {
  // Extract the endpoint path from the URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  console.log(`[ChatsAPI] Request received for path: ${path}, method: ${req.method}`);
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Parse request body if needed
    if (req.method !== 'GET') {
      await parseBody(req);
      console.log(`[ChatsAPI] Request body:`, req.body);
    }
    
    // Connect to database first (common for all handlers)
    await connectDB();
    
    // Route to appropriate handler based on path
    if (path === '/api/chats/private' && req.method === 'POST') {
      return await handleCreatePrivateChat(req, res);
    } else if (path === '/api/chats' && req.method === 'GET') {
      return await handleGetChats(req, res);
    } else {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found'
      });
    }
  } catch (error) {
    console.error(`[ChatsAPI] Error in ${path}:`, error);
    return res.status(500).json({
      success: false,
      message: `Server error processing ${path}`,
      error: error.message
    });
  }
}

/**
 * Handle GET request to retrieve user's chats
 */
async function handleGetChats(req, res) {
  try {
    // Authenticate user
    const authResult = await auth(req, res);
    if (!authResult || !authResult.success) {
      // Authentication error response already sent by middleware
      return;
    }
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    console.log(`[ChatsAPI] Getting chats for user ${req.user._id}, page ${page}, limit ${limit}`);
    
    // Find all chats where the user is a participant
    const chats = await Chat.find({
      'participants.user': req.user._id
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('participants.user', 'name email avatar isOnline lastSeen')
    .populate('lastMessage');
    
    console.log(`[ChatsAPI] Found ${chats.length} chats`);
    
    return res.status(200).json({
      success: true,
      chats,
      pagination: {
        page,
        limit,
        hasMore: chats.length === limit
      }
    });
  } catch (error) {
    console.error('[ChatsAPI] Get chats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving chats',
      error: error.message
    });
  }
}

/**
 * Handle POST request to create a new private chat
 */
async function handleCreatePrivateChat(req, res) {
  try {
    console.log('[ChatsAPI] Starting private chat creation...');
    
    // Authenticate user
    const authResult = await auth(req, res);
    if (!authResult || !authResult.success) {
      // Authentication error response already sent by middleware
      return;
    }
    
    // Access request body
    const { userId } = req.body;
    console.log('[ChatsAPI] Request to create chat with user:', userId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    console.log(`[ChatsAPI] Creating private chat between ${req.user._id} and ${userId}`);
    
    // Check if the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if they are friends
    const isFriend = req.user.friends && req.user.friends.some(
      friend => friend.user && (
        friend.user.toString() === userId || 
        (friend.user._id && friend.user._id.toString() === userId)
      )
    );
    
    // Log friendship status but don't block chat creation if they're not friends
    if (!isFriend) {
      console.log(`[ChatsAPI] Users are not friends. This could be due to recent friend acceptance.`);
    }
    
    // Check if a chat already exists between these two users
    const existingChat = await Chat.findOne({
      type: 'private',
      $and: [
        { 'participants.user': req.user._id },
        { 'participants.user': userId }
      ]
    }).populate('participants.user', 'name email avatar isOnline lastSeen');
    
    if (existingChat) {
      console.log('[ChatsAPI] Chat already exists:', existingChat._id);
      return res.status(200).json({
        success: true,
        chat: existingChat,
        message: 'Chat already exists'
      });
    }
    
    // Create a new private chat
    const newChat = new Chat({
      type: 'private',
      participants: [
        { user: req.user._id, role: 'member' },
        { user: userId, role: 'member' }
      ],
      createdBy: req.user._id
      // timestamps will be added automatically by Mongoose schema
    });
    
    console.log('[ChatsAPI] Saving new chat with participants:', newChat.participants);
    
    // Save the new chat
    await newChat.save();
    
    // Populate the participants
    const populatedChat = await Chat.findById(newChat._id)
      .populate('participants.user', 'name email avatar isOnline lastSeen');
    
    console.log('[ChatsAPI] New chat created:', newChat._id);
    
    return res.status(201).json({
      success: true,
      chat: populatedChat,
      message: 'Private chat created successfully'
    });
  } catch (error) {
    console.error('[ChatsAPI] Create private chat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating private chat',
      error: error.message
    });
  }
}

module.exports = allowCors(handler);
