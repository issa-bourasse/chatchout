// Fixed user search endpoint with CORS and auth handling
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
    console.log('MongoDB connected for user search endpoint');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Search users handler
async function handler(req, res) {
  console.log('User search request received, method:', req.method);
  console.log('Headers:', req.headers);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only process GET requests
  if (req.method !== 'GET') {
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
    
    // Get search query parameters
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 10;
    
    console.log('Search query:', query, 'Limit:', limit);
    
    // Find users matching the search query
    const searchResults = await User.find({
      $and: [
        { _id: { $ne: user._id } }, // Exclude current user
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name email avatar bio isOnline lastSeen')
    .limit(limit);
    
    console.log('Search results found:', searchResults.length);
    
    // Return search results
    return res.status(200).json({
      success: true,
      users: searchResults
    });
  } catch (error) {
    console.error('User search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during user search',
      error: error.message
    });
  }
}

module.exports = allowCors(handler);
