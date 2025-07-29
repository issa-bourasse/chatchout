const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chats
// @desc    Get user's chats
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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

    const { page = 1, limit = 20 } = req.query;

    const chats = await Chat.findUserChats(req.user._id, parseInt(page), parseInt(limit));

    // Get unread counts for each chat
    const chatsWithUnreadCounts = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.getUnreadCount(chat._id, req.user._id);
        const chatObj = chat.toObject();
        
        // For private chats, set the name to the other participant's name
        if (chat.type === 'private') {
          const otherParticipant = chat.participants.find(p =>
            p.user && p.user._id && p.user._id.toString() !== req.user._id.toString()
          );
          if (otherParticipant && otherParticipant.user) {
            chatObj.name = otherParticipant.user.name;
            chatObj.avatar = otherParticipant.user.avatar;
            chatObj.isOnline = otherParticipant.user.isOnline;
            chatObj.lastSeen = otherParticipant.user.lastSeen;
          }
        }
        
        chatObj.unreadCount = unreadCount;
        return chatObj;
      })
    );

    res.json({
      chats: chatsWithUnreadCounts,
      pagination: {
        current: parseInt(page),
        hasMore: chats.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({
      message: 'Server error getting chats'
    });
  }
});

// @route   POST /api/chats/private
// @desc    Create or get private chat
// @access  Private
router.post('/private', auth, [
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

    // Check if trying to chat with self
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Cannot create chat with yourself'
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if users are friends
    const currentUser = await User.findById(req.user._id);
    const areFriends = currentUser.friends.some(friend => 
      friend.user.toString() === userId
    );

    if (!areFriends) {
      return res.status(400).json({
        message: 'You can only chat with friends'
      });
    }

    // Create or get existing private chat
    const chat = await Chat.createPrivateChat(req.user._id, userId);
    
    // Populate the chat with user details
    await chat.populate('participants.user', 'name email avatar isOnline lastSeen');
    await chat.populate('lastMessage', 'content sender createdAt type');

    const chatObj = chat.toObject();
    
    // Set chat name to other participant's name
    const otherParticipant = chat.participants.find(p => 
      p.user._id.toString() !== req.user._id.toString()
    );
    if (otherParticipant) {
      chatObj.name = otherParticipant.user.name;
      chatObj.avatar = otherParticipant.user.avatar;
      chatObj.isOnline = otherParticipant.user.isOnline;
      chatObj.lastSeen = otherParticipant.user.lastSeen;
    }

    res.json({
      message: 'Private chat created/retrieved successfully',
      chat: chatObj
    });

  } catch (error) {
    console.error('Create private chat error:', error);
    res.status(500).json({
      message: 'Server error creating private chat'
    });
  }
});

// @route   POST /api/chats/group
// @desc    Create group chat
// @access  Private
router.post('/group', auth, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('participantIds')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required'),
  body('participantIds.*')
    .isMongoId()
    .withMessage('Invalid participant ID')
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

    const { name, description, participantIds } = req.body;

    // Remove duplicates and current user from participants
    const uniqueParticipantIds = [...new Set(participantIds)]
      .filter(id => id !== req.user._id.toString());

    // Check if all participants exist and are friends
    const participants = await User.find({ _id: { $in: uniqueParticipantIds } });
    
    if (participants.length !== uniqueParticipantIds.length) {
      return res.status(400).json({
        message: 'One or more participants not found'
      });
    }

    // Check if current user is friends with all participants
    const currentUser = await User.findById(req.user._id);
    const friendIds = currentUser.friends.map(friend => friend.user.toString());
    
    const nonFriends = uniqueParticipantIds.filter(id => !friendIds.includes(id));
    if (nonFriends.length > 0) {
      return res.status(400).json({
        message: 'You can only add friends to group chats'
      });
    }

    // Create group chat
    const chat = await Chat.createGroupChat(
      name, 
      description, 
      req.user._id, 
      uniqueParticipantIds
    );

    // Populate the chat with user details
    await chat.populate('participants.user', 'name email avatar isOnline lastSeen');

    // Create system message
    await Message.createSystemMessage(
      chat._id, 
      `${req.user.name} created the group "${name}"`
    );

    res.status(201).json({
      message: 'Group chat created successfully',
      chat: chat.toObject()
    });

  } catch (error) {
    console.error('Create group chat error:', error);
    res.status(500).json({
      message: 'Server error creating group chat'
    });
  }
});

// @route   GET /api/chats/:chatId
// @desc    Get specific chat details
// @access  Private
router.get('/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate('participants.user', 'name email avatar isOnline lastSeen')
      .populate('lastMessage', 'content sender createdAt type');

    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    if (!chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    const chatObj = chat.toObject();
    
    // For private chats, set the name to the other participant's name
    if (chat.type === 'private') {
      const otherParticipant = chat.participants.find(p => 
        p.user._id.toString() !== req.user._id.toString()
      );
      if (otherParticipant) {
        chatObj.name = otherParticipant.user.name;
        chatObj.avatar = otherParticipant.user.avatar;
        chatObj.isOnline = otherParticipant.user.isOnline;
        chatObj.lastSeen = otherParticipant.user.lastSeen;
      }
    }

    // Get unread count
    const unreadCount = await Message.getUnreadCount(chat._id, req.user._id);
    chatObj.unreadCount = unreadCount;

    res.json({
      chat: chatObj
    });

  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      message: 'Server error getting chat'
    });
  }
});

// @route   POST /api/chats/:chatId/invite
// @desc    Invite users to group chat
// @access  Private
router.post('/:chatId/invite', auth, [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('At least one user ID is required'),
  body('userIds.*')
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

    const { chatId } = req.params;
    const { userIds } = req.body;

    // Check if chat exists and is a group
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    if (chat.type !== 'group') {
      return res.status(400).json({
        message: 'Can only invite users to group chats'
      });
    }

    // Check if user is participant and has permission to invite
    if (!chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Check if invites are allowed or user is admin/owner
    if (!chat.settings.allowInvites && !chat.isAdminOrOwner(req.user._id)) {
      return res.status(403).json({
        message: 'Only admins can invite users to this group'
      });
    }

    // Remove duplicates and existing participants
    const existingParticipantIds = chat.participants.map(p => p.user.toString());
    const newUserIds = [...new Set(userIds)]
      .filter(id => !existingParticipantIds.includes(id));

    if (newUserIds.length === 0) {
      return res.status(400).json({
        message: 'All users are already participants'
      });
    }

    // Check if all users exist and are friends with the inviter
    const users = await User.find({ _id: { $in: newUserIds } });
    if (users.length !== newUserIds.length) {
      return res.status(400).json({
        message: 'One or more users not found'
      });
    }

    const currentUser = await User.findById(req.user._id);
    const friendIds = currentUser.friends.map(friend => friend.user.toString());

    const nonFriends = newUserIds.filter(id => !friendIds.includes(id));
    if (nonFriends.length > 0) {
      return res.status(400).json({
        message: 'You can only invite friends to group chats'
      });
    }

    // Add users to group
    const addedUsers = [];
    for (const userId of newUserIds) {
      try {
        await chat.addParticipant(userId, 'member');
        const user = users.find(u => u._id.toString() === userId);
        addedUsers.push(user.getBasicInfo());
      } catch (error) {
        console.error(`Error adding user ${userId}:`, error);
      }
    }

    // Create system message
    const userNames = addedUsers.map(u => u.name).join(', ');
    await Message.createSystemMessage(
      chat._id,
      `${req.user.name} added ${userNames} to the group`
    );

    // Populate updated chat
    await chat.populate('participants.user', 'name email avatar isOnline lastSeen');

    res.json({
      message: 'Users invited successfully',
      addedUsers,
      chat: chat.toObject()
    });

  } catch (error) {
    console.error('Invite users error:', error);
    res.status(500).json({
      message: 'Server error inviting users'
    });
  }
});

// @route   DELETE /api/chats/:chatId/participants/:userId
// @desc    Remove user from group chat
// @access  Private
router.delete('/:chatId/participants/:userId', auth, async (req, res) => {
  try {
    const { chatId, userId } = req.params;

    // Check if chat exists and is a group
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    if (chat.type !== 'group') {
      return res.status(400).json({
        message: 'Can only remove users from group chats'
      });
    }

    // Check permissions
    const isRemovingSelf = userId === req.user._id.toString();
    const isAdminOrOwner = chat.isAdminOrOwner(req.user._id);

    if (!isRemovingSelf && !isAdminOrOwner) {
      return res.status(403).json({
        message: 'Only admins can remove other users'
      });
    }

    // Check if target user is participant
    if (!chat.isParticipant(userId)) {
      return res.status(400).json({
        message: 'User is not a participant'
      });
    }

    // Get user info before removal
    const userToRemove = await User.findById(userId);
    if (!userToRemove) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Remove user from group
    await chat.removeParticipant(userId);

    // Create system message
    const action = isRemovingSelf ? 'left' : 'was removed from';
    const actor = isRemovingSelf ? userToRemove.name : req.user.name;
    await Message.createSystemMessage(
      chat._id,
      `${userToRemove.name} ${action} the group${!isRemovingSelf ? ` by ${actor}` : ''}`
    );

    res.json({
      message: 'User removed successfully'
    });

  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({
      message: 'Server error removing user'
    });
  }
});

// @route   PUT /api/chats/:chatId/participants/:userId/role
// @desc    Update user role in group chat
// @access  Private
router.put('/:chatId/participants/:userId/role', auth, [
  body('role')
    .isIn(['member', 'admin'])
    .withMessage('Role must be either member or admin')
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

    const { chatId, userId } = req.params;
    const { role } = req.body;

    // Check if chat exists and is a group
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    if (chat.type !== 'group') {
      return res.status(400).json({
        message: 'Can only update roles in group chats'
      });
    }

    // Check if current user is owner
    const currentUserParticipant = chat.getParticipantInfo(req.user._id);
    if (!currentUserParticipant || currentUserParticipant.role !== 'owner') {
      return res.status(403).json({
        message: 'Only group owners can update user roles'
      });
    }

    // Check if target user is participant
    if (!chat.isParticipant(userId)) {
      return res.status(400).json({
        message: 'User is not a participant'
      });
    }

    // Cannot change owner role
    const targetUserParticipant = chat.getParticipantInfo(userId);
    if (targetUserParticipant.role === 'owner') {
      return res.status(400).json({
        message: 'Cannot change owner role'
      });
    }

    // Update role
    await chat.updateParticipantRole(userId, role);

    // Get user info for system message
    const user = await User.findById(userId);
    await Message.createSystemMessage(
      chat._id,
      `${user.name} is now ${role === 'admin' ? 'an admin' : 'a member'}`
    );

    res.json({
      message: 'User role updated successfully'
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      message: 'Server error updating user role'
    });
  }
});

// @route   PUT /api/chats/:chatId/settings
// @desc    Update group chat settings
// @access  Private
router.put('/:chatId/settings', auth, [
  body('allowInvites')
    .optional()
    .isBoolean()
    .withMessage('Allow invites must be a boolean'),
  body('muteNotifications')
    .optional()
    .isBoolean()
    .withMessage('Mute notifications must be a boolean')
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

    const { chatId } = req.params;
    const { allowInvites, muteNotifications } = req.body;

    // Check if chat exists and is a group
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    if (chat.type !== 'group') {
      return res.status(400).json({
        message: 'Can only update settings for group chats'
      });
    }

    // Check if user is admin or owner
    if (!chat.isAdminOrOwner(req.user._id)) {
      return res.status(403).json({
        message: 'Only admins can update group settings'
      });
    }

    // Update settings
    if (allowInvites !== undefined) {
      chat.settings.allowInvites = allowInvites;
    }
    if (muteNotifications !== undefined) {
      chat.settings.muteNotifications = muteNotifications;
    }

    await chat.save();

    res.json({
      message: 'Group settings updated successfully',
      settings: chat.settings
    });

  } catch (error) {
    console.error('Update group settings error:', error);
    res.status(500).json({
      message: 'Server error updating group settings'
    });
  }
});

module.exports = router;
