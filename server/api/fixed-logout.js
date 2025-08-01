// Fixed logout endpoint with CORS and auth handling
const allowCors = require('./allowCors');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('./auth-middleware');
require('dotenv').config();

// Connect to MongoDB if not already connected
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected for logout endpoint');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Logout handler
async function handler(req, res) {
  console.log('Logout request received, method:', req.method);
  console.log('Headers:', req.headers);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only process POST requests
  if (req.method !== 'POST') {
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
    
    // Update user's online status to offline
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();
    
    console.log('User logged out:', user.name);
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message
    });
  }
}

module.exports = allowCors(handler);
