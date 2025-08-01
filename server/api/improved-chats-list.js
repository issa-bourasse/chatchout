// Improved chats list handler for Vercel serverless functions
const allowCors = require('./allowCors');
const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const authenticate = require('./auth-middleware-new');
require('dotenv').config();

// Connect to MongoDB if not already connected
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('[ChatsList] MongoDB connected');
  } catch (err) {
    console.error('[ChatsList] MongoDB connection error:', err);
    throw err;
  }
}

/**
 * Handle chats list requests
 */
async function handler(req, res) {
  console.log('[ChatsList] Request received, method:', req.method);
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
  
  try {
    // Authenticate user
    const authResult = await authenticate(req, res);
    if (!authResult || !authResult.success) {
      // Authentication error response already sent by middleware
      return;
    }
    
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    console.log('[ChatsList] Pagination:', { page, limit, skip });
    
    // Connect to database
    await connectDB();
    
    // Find user's chats
    const chats = await Chat.find({
      participants: req.user._id
    })
    .populate('participants', '_id name avatar isOnline lastSeen')
    .populate({
      path: 'lastMessage',
      select: 'content sender createdAt',
      populate: {
        path: 'sender',
        select: '_id name'
      }
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);
    
    console.log('[ChatsList] Found', chats.length, 'chats');
    
    // Count total chats for pagination
    const total = await Chat.countDocuments({ participants: req.user._id });
    
    // Return results
    return res.status(200).json({
      success: true,
      chats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[ChatsList] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving chats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = allowCors(handler);
