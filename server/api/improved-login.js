// Improved login handler for Vercel serverless functions
const allowCors = require('./allowCors');
const bcrypt = require('bcryptjs');
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
    console.log('[Login] MongoDB connected');
  } catch (err) {
    console.error('[Login] MongoDB connection error:', err);
    throw err;
  }
}

/**
 * Handle login requests
 */
async function handler(req, res) {
  console.log('[Login] Request received, method:', req.method);
  
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
  
  // Extract credentials
  const { email, password } = req.body;
  console.log('[Login] Login attempt for email:', email);
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  try {
    // Connect to database
    await connectDB();
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('[Login] User not found for email:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[Login] Password mismatch for email:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update user status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    console.log('[Login] Generated token for user:', user._id);
    
    // Prepare user data (excluding password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    };
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('[Login] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = allowCors(handler);
