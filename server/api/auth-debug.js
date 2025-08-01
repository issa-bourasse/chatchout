// Auth test tool for debugging login issues
const allowCors = require('./allowCors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB if not already connected
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('[AuthDebug] MongoDB connected');
  } catch (err) {
    console.error('[AuthDebug] MongoDB connection error:', err);
    throw err;
  }
}

/**
 * Debug tool for authentication issues
 */
async function handler(req, res) {
  console.log('[AuthDebug] Request received, method:', req.method);
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Connect to database
    await connectDB();
    
    // Get email from query or default test account
    const email = req.query.email || 'test@example.com';
    console.log('[AuthDebug] Looking up user with email:', email);
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        email
      });
    }
    
    // Get password info
    const passwordInfo = {
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      isHashed: user.password ? user.password.length > 20 : false // Hashed passwords are typically long
    };
    
    // If password provided in query, test it
    let passwordMatch = null;
    if (req.query.password) {
      const testResult = await bcrypt.compare(req.query.password, user.password);
      passwordMatch = {
        tested: true,
        match: testResult
      };
    }
    
    // Return user details without the actual password
    const userDetails = {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user._id.getTimestamp(),
      passwordInfo,
      passwordMatch
    };
    
    return res.status(200).json({
      success: true,
      message: 'User found',
      user: userDetails
    });
    
  } catch (error) {
    console.error('[AuthDebug] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during debug',
      error: error.message
    });
  }
}

module.exports = allowCors(handler);
