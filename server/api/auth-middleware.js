// Fixed authentication middleware for Vercel serverless functions
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB if not already connected
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected for auth middleware');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Authentication middleware - no CORS wrapping here
async function auth(req, res) {
  try {
    console.log('Auth middleware: Checking token');
    // Get token from header
    let token = req.headers.authorization;
    
    // Handle different authorization header formats
    if (token && token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
    
    console.log('Token present:', !!token);
    
    if (!token) {
      console.log('No token provided');
      res.status(401).json({ 
        success: false,
        message: 'No token provided, authorization denied' 
      });
      return null;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);
    
    // Connect to DB
    await connectDB();
    
    // Get user from database - note we check both id and userId
    // because we've had different token formats
    const userId = decoded.id || decoded.userId;
    console.log('Looking for user with ID:', userId);
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.log('User not found for ID:', userId);
      res.status(401).json({ 
        success: false,
        message: 'Token is not valid, user not found' 
      });
      return null;
    }

    console.log('User authenticated:', user.name);
    
    // Return the authenticated user
    return user;
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({ 
        success: false,
        message: 'Token has expired' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Server error during authentication',
        error: error.message
      });
    }
    
    return null;
  }
}

// Export the middleware
module.exports = auth;
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired' 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: 'Server error during authentication',
      error: error.message
    });
  }
}

// Export the middleware
module.exports = allowCors(auth);
