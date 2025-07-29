const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/search
// @desc    Search for users
// @access  Private
router.get('/search', auth, [
  query('q')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { q: searchTerm, limit = 10 } = req.query;

    // Search for users excluding current user
    const users = await User.searchUsers(searchTerm, req.user._id, parseInt(limit));

    res.json({
      users: users.map(user => user.getBasicInfo()),
      count: users.length
    });

  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      message: 'Server error during user search'
    });
  }
});

// @route   GET /api/users/:userId
// @desc    Get user profile by ID
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -friendRequests -blockedUsers')
      .populate('friends.user', 'name email avatar isOnline lastSeen');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if the requesting user is friends with this user
    const currentUser = await User.findById(req.user._id);
    const isFriend = currentUser.friends.some(friend => 
      friend.user.toString() === userId
    );

    const userProfile = user.getPublicProfile();
    userProfile.isFriend = isFriend;

    res.json({
      user: userProfile
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      message: 'Server error getting user profile'
    });
  }
});

// @route   GET /api/users
// @desc    Get all users (for admin or development)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name email avatar isOnline lastSeen createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({ _id: { $ne: req.user._id } });

    res.json({
      users: users.map(user => user.getBasicInfo()),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Server error getting users'
    });
  }
});

// @route   PUT /api/users/online-status
// @desc    Update user online status
// @access  Private
router.put('/online-status', auth, [
  body('isOnline')
    .isBoolean()
    .withMessage('Online status must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { isOnline } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        isOnline,
        lastSeen: new Date()
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Online status updated',
      user: user.getBasicInfo()
    });

  } catch (error) {
    console.error('Update online status error:', error);
    res.status(500).json({
      message: 'Server error updating online status'
    });
  }
});

// @route   GET /api/users/me/friends
// @desc    Get current user's friends
// @access  Private
router.get('/me/friends', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends.user', 'name email avatar isOnline lastSeen')
      .select('friends');

    const friends = user.friends
      .filter(friend => friend && friend.user) // Filter out undefined friends
      .map(friend => ({
        ...friend.user.getBasicInfo(),
        addedAt: friend.addedAt
      }));

    res.json({
      friends,
      count: friends.length
    });

  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      message: 'Server error getting friends'
    });
  }
});

// @route   GET /api/users/me/friend-requests
// @desc    Get current user's friend requests
// @access  Private
router.get('/me/friend-requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friendRequests.sent.user', 'name email avatar isOnline lastSeen')
      .populate('friendRequests.received.user', 'name email avatar isOnline lastSeen')
      .select('friendRequests');

    const sentRequests = user.friendRequests.sent.map(request => ({
      ...request.user.getBasicInfo(),
      sentAt: request.sentAt
    }));

    const receivedRequests = user.friendRequests.received.map(request => ({
      ...request.user.getBasicInfo(),
      receivedAt: request.receivedAt
    }));

    res.json({
      sent: sentRequests,
      received: receivedRequests,
      counts: {
        sent: sentRequests.length,
        received: receivedRequests.length
      }
    });

  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      message: 'Server error getting friend requests'
    });
  }
});

module.exports = router;
