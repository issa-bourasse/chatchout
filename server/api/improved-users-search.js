// Improved user search handler for Vercel serverless functions
const allowCors = require('./allowCors');
const mongoose = require('mongoose');
const User = require('../models/User');
const authenticate = require('./auth-middleware-new');
require('dotenv').config();

// Connect to MongoDB if not already connected
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('[UserSearch] MongoDB connected');
  } catch (err) {
    console.error('[UserSearch] MongoDB connection error:', err);
    throw err;
  }
}

/**
 * Handle user search requests
 */
async function handler(req, res) {
  console.log('[UserSearch] Request received, method:', req.method);
  
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
    
    // Extract query parameters
    const { q, limit = 10 } = req.query;
    console.log('[UserSearch] Search query:', q, 'Limit:', limit);
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Connect to database
    await connectDB();
    
    // Search for users
    const searchRegex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ],
      _id: { $ne: req.user._id } // Exclude current user
    })
    .select('_id name email avatar bio isOnline lastSeen')
    .limit(parseInt(limit));
    
    console.log('[UserSearch] Found', users.length, 'users');
    
    // Return results
    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('[UserSearch] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during user search',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = allowCors(handler);
