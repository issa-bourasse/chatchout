// Consolidated API handlers for Vercel serverless functions
const allowCors = require('./allowCors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const auth = require('./auth-middleware-new');
require('dotenv').config();

// Connect to MongoDB if not already connected
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('[API] MongoDB connected');
  } catch (err) {
    console.error('[API] MongoDB connection error:', err);
    throw err;
  }
}

/**
 * Combined API handler for multiple endpoints
 * This reduces the number of serverless functions needed
 */
async function handler(req, res) {
  // Extract the endpoint path from the URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  console.log(`[API] Request received for path: ${path}, method: ${req.method}`);
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Connect to database first (common for all handlers)
    await connectDB();
    
    // Route to appropriate handler based on path
    if (path === '/api/auth/login') {
      return await handleLogin(req, res);
    } else if (path === '/api/auth/logout') {
      return await handleLogout(req, res);
    } else if (path === '/api/users/search') {
      return await handleUserSearch(req, res);
    } else if (path === '/api/chats') {
      return await handleChatsList(req, res);
    } else {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found'
      });
    }
  } catch (error) {
    console.error(`[API] Error in ${path}:`, error);
    return res.status(500).json({
      success: false,
      message: `Server error processing ${path}`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Handle login requests
 */
async function handleLogin(req, res) {
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
  console.log('[Login] Request body:', JSON.stringify(req.body));
  
  // Validate input
  if (!email || !password) {
    console.log('[Login] Missing required fields. Email exists:', !!email, 'Password exists:', !!password);
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  try {
    // Find user by email
    const user = await User.findOne({ email });
    console.log('[Login] User found:', !!user, user ? `ID: ${user._id}` : 'Not found');
    
    if (!user) {
      console.log('[Login] User not found for email:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Verify password using both methods for reliability
    console.log('[Login] Comparing password...');
    console.log('[Login] User password hash:', user.password ? user.password.substring(0, 10) + '...' : 'missing');
    
    let isMatch = false;
    
    // Method 1: Use model's comparePassword method if available
    if (typeof user.comparePassword === 'function') {
      try {
        isMatch = await user.comparePassword(password);
        console.log('[Login] Password match using model method:', isMatch);
      } catch (e) {
        console.error('[Login] Model comparePassword error:', e.message);
      }
    }
    
    // Method 2: Use direct bcrypt compare as fallback
    if (!isMatch) {
      try {
        isMatch = await bcrypt.compare(password, user.password);
        console.log('[Login] Password match using direct bcrypt:', isMatch);
      } catch (e) {
        console.error('[Login] Bcrypt comparison error:', e.message);
      }
    }
    
    if (!isMatch) {
      console.log('[Login] Password mismatch for email:', email);
      
      // For debugging only - REMOVE IN PRODUCTION!
      const salt = await bcrypt.genSalt(10);
      const hashedAttempt = await bcrypt.hash(password, salt);
      console.log('[Login] DEBUG - Attempted password sample hash:', hashedAttempt.substring(0, 10) + '...');
      
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update user status - we're now keeping users online longer
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();
    
    // Generate JWT token with longer expiry
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }  // Increased from 7d to 30d
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
    throw error;
  }
}

/**
 * Handle logout requests
 */
async function handleLogout(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
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
    throw error;
  }
}

/**
 * Handle user search requests
 */
async function handleUserSearch(req, res) {
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
    
    // Extract query parameters
    const { q, limit = 10 } = req.query;
    console.log('[UserSearch] Search query:', q, 'Limit:', limit);
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
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
    throw error;
  }
}

/**
 * Handle chats list requests
 */
async function handleChatsList(req, res) {
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
    
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    console.log('[ChatsList] Pagination:', { page, limit, skip });
    
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
    throw error;
  }
}

module.exports = allowCors(handler);
