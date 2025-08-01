// Session check handler for keeping users logged in
const allowCors = require('./allowCors');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('./auth-middleware-new');
const config = require('../utils/config');
require('dotenv').config();

// Connect to MongoDB if not already connected
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('[SessionCheck] MongoDB connected');
  } catch (err) {
    console.error('[SessionCheck] MongoDB connection error:', err);
    throw err;
  }
}

/**
 * Session check handler to validate user session is still active
 * Used to keep users logged in and refresh their session
 */
async function handler(req, res) {
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
    // Connect to database
    await connectDB();
    
    // Return feature configuration even without authentication
    // This allows clients to know which features are enabled
    if (!req.headers.authorization) {
      console.log('[SessionCheck] No authentication token, returning basic config only');
      return res.status(200).json({
        success: true,
        message: 'Basic configuration',
        authenticated: false,
        config: {
          features: config.features
        }
      });
    }
    
    // Authenticate user
    const authResult = await auth(req, res);
    if (!authResult || !authResult.success) {
      // If auth failed but we haven't sent a response yet, send basic config
      if (!res.headersSent) {
        return res.status(200).json({
          success: true,
          message: 'Authentication failed, but returning basic config',
          authenticated: false,
          config: {
            features: config.features
          }
        });
      }
      return;
    }
    
    // At this point the user is authenticated
    console.log('[SessionCheck] Session valid for user:', req.user._id);
    
    // Get fresh user data
    const user = await User.findById(req.user._id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update last seen timestamp but don't change online status
    // This helps maintain session without forcing status changes
    await User.findByIdAndUpdate(user._id, {
      lastSeen: new Date()
    }, { new: false });
    
    // Return user data and feature config
    return res.status(200).json({
      success: true,
      message: 'Session valid',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      },
      config: {
        features: config.features
      }
    });
  } catch (error) {
    console.error('[SessionCheck] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing session check',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = allowCors(handler);
