// Direct serverless function for registration - no Express app
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// CORS middleware helper
const allowCors = require('./allowCors');

// Connect to MongoDB if not already connected
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected for direct register endpoint');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Handler function
async function handler(req, res) {
  // Only allow POST method for actual registration
  if (req.method === 'POST') {
    // Connect to MongoDB
    try {
      await connectDB();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: error.message
      });
    }

    try {
      console.log('Register request received at direct endpoint:', req.body);
      
      // Handle both name and username fields (frontend might send name instead of username)
      let username = req.body.username;
      const email = req.body.email;
      const password = req.body.password;
      
      // If frontend sends name instead of username
      if (!username && req.body.name) {
        username = req.body.name;
      }

      console.log('Processed registration data:', { username, email, password: '***' });

      // Input validation
      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide username, email and password' 
        });
      }

      // Check if user already exists
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

      // Send response
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
      console.error('Registration error in direct endpoint:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during registration',
        error: error.message
      });
    }
  } else if (req.method === 'GET') {
    // For testing - a simple GET response
    return res.status(200).json({
      success: true,
      message: 'Registration endpoint is working (GET)',
      mode: 'direct serverless function'
    });
  } else {
    // Should never reach here due to CORS middleware handling OPTIONS
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }
}

// Export with CORS wrapper
module.exports = allowCors(handler);
