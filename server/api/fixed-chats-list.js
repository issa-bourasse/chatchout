// Fixed chats endpoint with CORS and auth handling
const allowCors = require('./allowCors');
const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const auth = require('./auth-middleware');
require('dotenv').config();

// Connect to MongoDB if not already connected
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected for chats endpoint');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Get user chats handler
async function handler(req, res) {
  console.log('Get chats request received, method:', req.method);
  console.log('Headers:', req.headers);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only process GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Authenticate user
    const user = await auth(req, res);
    if (!user) {
      // Auth middleware will handle the response
      return;
    }
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    console.log('Pagination:', { page, limit, skip });
    
    // Find chats for the current user
    const chats = await Chat.find({
      participants: user._id
    })
    .populate('participants', 'name email avatar isOnline lastSeen')
    .populate({
      path: 'lastMessage',
      select: 'sender content createdAt readBy',
      populate: {
        path: 'sender',
        select: 'name avatar'
      }
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);
    
    console.log('Chats found:', chats.length);
    
    // Count total chats for pagination
    const totalChats = await Chat.countDocuments({
      participants: user._id
    });
    
    // Return chats
    return res.status(200).json({
      success: true,
      chats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalChats / limit),
        totalChats
      }
    });
  } catch (error) {
    console.error('Get chats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving chats',
      error: error.message
    });
  }
}

module.exports = allowCors(handler);
