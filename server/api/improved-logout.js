// Improved logout handler for Vercel serverless functions
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
    console.log('[Logout] MongoDB connected');
  } catch (err) {
    console.error('[Logout] MongoDB connection error:', err);
    throw err;
  }
}

/**
 * Handle logout requests
 */
async function handler(req, res) {
  console.log('[Logout] Request received, method:', req.method);
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
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
    
    // Connect to database
    await connectDB();
    
    // Update user status
    const user = req.user;
    console.log('[Logout] Logging out user:', user._id);
    
    await User.findByIdAndUpdate(user._id, {
      isOnline: false,
      lastSeen: new Date()
    });
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('[Logout] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = allowCors(handler);
