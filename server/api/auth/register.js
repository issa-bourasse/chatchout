// Direct API route for /api/auth/register
// This will work as a serverless function at /api/auth/register

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for register endpoint'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();

// Special CORS for this endpoint
app.use(cors({
  origin: ['https://chatchout.vercel.app', 'https://chatchout-q7j21vtf6-cheimabarhoumis-projects.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle OPTIONS preflight
app.options('*', cors());

// Body parsing
app.use(express.json());

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Register request received:', req.body);
    
    const { username, email, password } = req.body;

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
    res.status(201).json({
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
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
});

module.exports = app;
