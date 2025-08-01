// Fixed login handler
const allowCors = require('./allowCors');
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Connect to MongoDB if not already connected
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected for fixed login endpoint');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Separate function to compare passwords
const comparePassword = async (password, userPassword) => {
  return await bcrypt.compare(password, userPassword);
};

// Handler function
async function handler(req, res) {
  console.log('Login request received, method:', req.method);
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
    // Connect to MongoDB
    await connectDB();
    
    console.log('Request body:', req.body);
    
    // Extract fields
    const email = req.body.email;
    const password = req.body.password;
    
    console.log('Processed login data:', { email, password: '***' });
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await comparePassword(password, user.password);
    
    if (!isMatch) {
      console.log('Password does not match for user:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update user online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
}

module.exports = allowCors(handler);
