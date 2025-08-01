// Fixed register handler that maps 'name' to 'username'
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
    console.log('MongoDB connected for fixed register endpoint');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Handler function
async function handler(req, res) {
  console.log('Register request received, method:', req.method);
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
    
    // Extract fields and handle name/username mapping
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    
    // Use name as username if name is provided
    const username = name || req.body.username;
    
    console.log('Processed registration data:', { username, email, password: '***' });
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password'
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with that email or username already exists'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    // Return success response
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
}

module.exports = allowCors(handler);
