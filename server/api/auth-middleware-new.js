// Authentication middleware for Vercel serverless functions
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB if not already connected
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected in auth-middleware');
  } catch (err) {
    console.error('MongoDB connection error in auth-middleware:', err);
    throw err;
  }
}

/**
 * Authentication middleware for Vercel serverless functions
 * Can be used in two ways:
 * 1. As a middleware in standard Express routes
 * 2. As a function that returns auth result in serverless functions
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    let token = req.headers.authorization;
    
    // Handle different authorization header formats
    if (token && token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
    
    console.log('[Auth] Token present:', !!token);
    
    if (!token) {
      return handleError(res, 401, 'No authentication token provided');
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[Auth] Token verified, payload:', decoded);
    } catch (tokenError) {
      console.error('[Auth] Token verification failed:', tokenError);
      if (tokenError.name === 'TokenExpiredError') {
        return handleError(res, 401, 'Authentication token has expired');
      } else {
        return handleError(res, 401, 'Invalid authentication token');
      }
    }
    
    // Connect to MongoDB
    try {
      await connectDB();
    } catch (dbError) {
      console.error('[Auth] Database connection error:', dbError);
      return handleError(res, 500, 'Database connection error');
    }
    
    // Get user ID from token - handle different formats
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      console.error('[Auth] No user ID in token payload');
      return handleError(res, 401, 'Invalid token format');
    }
    
    console.log('[Auth] Looking for user with ID:', userId);
    
    // Find user in database
    let user;
    try {
      user = await User.findById(userId).select('-password');
    } catch (userError) {
      console.error('[Auth] Error finding user:', userError);
      return handleError(res, 500, 'Error retrieving user data');
    }
    
    if (!user) {
      console.error('[Auth] User not found with ID:', userId);
      return handleError(res, 401, 'User not found');
    }
    
    console.log('[Auth] User authenticated:', user.name);
    
    // Set user in request
    req.user = user;
    req.userId = userId;
    
    // Continue to route handler or return success
    if (typeof next === 'function') {
      return next();
    } else {
      return {
        success: true,
        user
      };
    }
  } catch (error) {
    console.error('[Auth] Unexpected error:', error);
    return handleError(res, 500, 'Server error during authentication');
  }
};

/**
 * Helper function to send error responses
 */
function handleError(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = auth;
