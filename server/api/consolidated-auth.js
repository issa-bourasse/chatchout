// Consolidated authentication handlers for Vercel serverless functions
const allowCors = require('./allowCors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
    console.log('[Auth] MongoDB connected');
  } catch (err) {
    console.error('[Auth] MongoDB connection error:', err);
    throw err;
  }
}

/**
 * Combined authentication handler for multiple endpoints
 * This reduces the number of serverless functions needed
 */
async function handler(req, res) {
  // Extract the endpoint path from the URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  console.log(`[Auth] Request received for path: ${path}, method: ${req.method}`);
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Connect to database first (common for all handlers)
    await connectDB();
    
    // Route to appropriate handler based on path
    if (path === '/api/auth/register') {
      return await handleRegister(req, res);
    } else if (path === '/api/auth/test') {
      return await handleAuthTest(req, res);
    } else {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found'
      });
    }
  } catch (error) {
    console.error(`[Auth] Error in ${path}:`, error);
    return res.status(500).json({
      success: false,
      message: `Server error processing ${path}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Handle registration requests
 */
async function handleRegister(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
  
  // Extract user data
  const { name, email, password } = req.body;
  console.log('[Register] Registration attempt for email:', email);
  console.log('[Register] Request body:', JSON.stringify(req.body));
  
  // Validate input
  if (!name || !email || !password) {
    console.log('[Register] Missing required fields. Name exists:', !!name, 'Email exists:', !!email, 'Password exists:', !!password);
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required'
    });
  }
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    console.log('[Register] User already exists:', !!existingUser);
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    
    // Create new user object first without saving
    const user = new User({
      name,
      email,
      password: 'placeholder', // Will be replaced with hashed password
      isOnline: true,
      lastSeen: new Date()
    });
    
    // Hash password
    console.log('[Register] Hashing password...');
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      console.log('[Register] Password hashed successfully, length:', hashedPassword.length);
      console.log('[Register] Password hash sample:', hashedPassword.substring(0, 10) + '...');
      
      // Set the hashed password
      user.password = hashedPassword;
    } catch (e) {
      console.error('[Register] Password hashing error:', e.message);
      return res.status(500).json({
        success: false,
        message: 'Error during account creation'
      });
    }
    
    // Save user
    try {
      await user.save();
      console.log('[Register] User registered:', user._id, 'with email:', user.email);
    } catch (e) {
      console.error('[Register] User save error:', e.message);
      return res.status(500).json({
        success: false,
        message: 'Error saving user account',
        error: e.message
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
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
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userData
    });
  } catch (error) {
    console.error('[Register] Error:', error);
    throw error;
  }
}

/**
 * Handle authentication test requests
 */
async function handleAuthTest(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
  
  try {
    // Authenticate user
    const authResult = await auth(req, res);
    if (!authResult || !authResult.success) {
      // Authentication error response already sent by middleware
      return;
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      user: req.user
    });
  } catch (error) {
    console.error('[AuthTest] Error:', error);
    throw error;
  }
}

module.exports = allowCors(handler);
