const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/friends/request
// @desc    Send friend request
// @access  Private
router.post('/request', auth, [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
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

    const { userId } = req.body;
    const currentUserId = req.user._id;

    // Check if trying to send request to self
    if (userId === currentUserId.toString()) {
      return res.status(400).json({
        message: 'Cannot send friend request to yourself'
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if already friends
    const isAlreadyFriend = currentUser.friends.some(friend => 
      friend.user.toString() === userId
    );
    if (isAlreadyFriend) {
      return res.status(400).json({
        message: 'You are already friends with this user'
      });
    }

    // Check if request already sent
    const requestAlreadySent = currentUser.friendRequests.sent.some(request => 
      request.user.toString() === userId
    );
    if (requestAlreadySent) {
      return res.status(400).json({
        message: 'Friend request already sent'
      });
    }

    // Check if request already received from this user
    const requestAlreadyReceived = currentUser.friendRequests.received.some(request => 
      request.user.toString() === userId
    );
    if (requestAlreadyReceived) {
      return res.status(400).json({
        message: 'This user has already sent you a friend request'
      });
    }

    // Add to sender's sent requests
    currentUser.friendRequests.sent.push({
      user: userId,
      sentAt: new Date()
    });

    // Add to receiver's received requests
    targetUser.friendRequests.received.push({
      user: currentUserId,
      receivedAt: new Date()
    });

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      message: 'Friend request sent successfully',
      sentTo: targetUser.getBasicInfo()
    });

  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      message: 'Server error sending friend request'
    });
  }
});

// @route   POST /api/friends/accept
// @desc    Accept friend request
// @access  Private
router.post('/accept', auth, [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
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

    const { userId } = req.body;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    const senderUser = await User.findById(userId);

    if (!senderUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if friend request exists
    const requestIndex = currentUser.friendRequests.received.findIndex(request => 
      request.user.toString() === userId
    );

    if (requestIndex === -1) {
      return res.status(400).json({
        message: 'No friend request found from this user'
      });
    }

    // Remove from received requests
    currentUser.friendRequests.received.splice(requestIndex, 1);

    // Remove from sender's sent requests
    const senderRequestIndex = senderUser.friendRequests.sent.findIndex(request => 
      request.user.toString() === currentUserId.toString()
    );
    if (senderRequestIndex !== -1) {
      senderUser.friendRequests.sent.splice(senderRequestIndex, 1);
    }

    // Add to both users' friends lists
    const addedAt = new Date();
    currentUser.friends.push({
      user: userId,
      addedAt
    });

    senderUser.friends.push({
      user: currentUserId,
      addedAt
    });

    await Promise.all([currentUser.save(), senderUser.save()]);

    res.json({
      message: 'Friend request accepted',
      newFriend: senderUser.getBasicInfo()
    });

  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      message: 'Server error accepting friend request'
    });
  }
});

// @route   POST /api/friends/reject
// @desc    Reject friend request
// @access  Private
router.post('/reject', auth, [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
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

    const { userId } = req.body;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    const senderUser = await User.findById(userId);

    if (!senderUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if friend request exists
    const requestIndex = currentUser.friendRequests.received.findIndex(request => 
      request.user.toString() === userId
    );

    if (requestIndex === -1) {
      return res.status(400).json({
        message: 'No friend request found from this user'
      });
    }

    // Remove from received requests
    currentUser.friendRequests.received.splice(requestIndex, 1);

    // Remove from sender's sent requests
    const senderRequestIndex = senderUser.friendRequests.sent.findIndex(request => 
      request.user.toString() === currentUserId.toString()
    );
    if (senderRequestIndex !== -1) {
      senderUser.friendRequests.sent.splice(senderRequestIndex, 1);
    }

    await Promise.all([currentUser.save(), senderUser.save()]);

    res.json({
      message: 'Friend request rejected'
    });

  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({
      message: 'Server error rejecting friend request'
    });
  }
});

// @route   DELETE /api/friends/remove
// @desc    Remove friend
// @access  Private
router.delete('/remove', auth, [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
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

    const { userId } = req.body;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    const friendUser = await User.findById(userId);

    if (!friendUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if they are friends
    const friendIndex = currentUser.friends.findIndex(friend => 
      friend.user.toString() === userId
    );

    if (friendIndex === -1) {
      return res.status(400).json({
        message: 'You are not friends with this user'
      });
    }

    // Remove from both users' friends lists
    currentUser.friends.splice(friendIndex, 1);

    const friendUserIndex = friendUser.friends.findIndex(friend => 
      friend.user.toString() === currentUserId.toString()
    );
    if (friendUserIndex !== -1) {
      friendUser.friends.splice(friendUserIndex, 1);
    }

    await Promise.all([currentUser.save(), friendUser.save()]);

    res.json({
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      message: 'Server error removing friend'
    });
  }
});

// @route   POST /api/friends/cancel-request
// @desc    Cancel sent friend request
// @access  Private
router.post('/cancel-request', auth, [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
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

    const { userId } = req.body;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if request was sent
    const sentRequestIndex = currentUser.friendRequests.sent.findIndex(request => 
      request.user.toString() === userId
    );

    if (sentRequestIndex === -1) {
      return res.status(400).json({
        message: 'No friend request found to this user'
      });
    }

    // Remove from sent requests
    currentUser.friendRequests.sent.splice(sentRequestIndex, 1);

    // Remove from target user's received requests
    const receivedRequestIndex = targetUser.friendRequests.received.findIndex(request => 
      request.user.toString() === currentUserId.toString()
    );
    if (receivedRequestIndex !== -1) {
      targetUser.friendRequests.received.splice(receivedRequestIndex, 1);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      message: 'Friend request cancelled'
    });

  } catch (error) {
    console.error('Cancel friend request error:', error);
    res.status(500).json({
      message: 'Server error cancelling friend request'
    });
  }
});

module.exports = router;
