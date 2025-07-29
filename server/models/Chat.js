const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Chat name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true,
    default: 'private'
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'admin', 'owner'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  avatar: {
    type: String,
    default: function() {
      if (this.type === 'group') {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name || 'Group')}&background=6366f1&color=fff&size=128`;
      }
      return null;
    }
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  settings: {
    allowInvites: {
      type: Boolean,
      default: true
    },
    muteNotifications: {
      type: Boolean,
      default: false
    },
    disappearingMessages: {
      enabled: {
        type: Boolean,
        default: false
      },
      duration: {
        type: Number, // in hours
        default: 24
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
chatSchema.index({ participants: 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ type: 1 });

// Virtual for participant count
chatSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Virtual to check if chat is group
chatSchema.virtual('isGroup').get(function() {
  return this.type === 'group';
});

// Pre-save middleware to set chat name for private chats
chatSchema.pre('save', async function(next) {
  if (this.type === 'private' && !this.name && this.participants.length === 2) {
    // For private chats, we'll set the name on the client side based on the other participant
    this.name = 'Private Chat';
  }
  next();
});

// Instance method to add participant
chatSchema.methods.addParticipant = function(userId, role = 'member') {
  const existingParticipant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    throw new Error('User is already a participant');
  }
  
  this.participants.push({
    user: userId,
    role,
    joinedAt: new Date()
  });
  
  return this.save();
};

// Instance method to remove participant
chatSchema.methods.removeParticipant = function(userId) {
  const participantIndex = this.participants.findIndex(p => 
    p.user.toString() === userId.toString()
  );
  
  if (participantIndex === -1) {
    throw new Error('User is not a participant');
  }
  
  this.participants.splice(participantIndex, 1);
  
  // If no participants left, mark chat as inactive
  if (this.participants.length === 0) {
    this.isActive = false;
  }
  
  return this.save();
};

// Instance method to update participant role
chatSchema.methods.updateParticipantRole = function(userId, newRole) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('User is not a participant');
  }
  
  participant.role = newRole;
  return this.save();
};

// Instance method to check if user is participant
chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => {
    // Handle both populated and non-populated user references
    const participantUserId = p.user._id || p.user;
    return participantUserId.toString() === userId.toString();
  });
};

// Instance method to check if user is admin or owner
chatSchema.methods.isAdminOrOwner = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  return participant && (participant.role === 'admin' || participant.role === 'owner');
};

// Instance method to get participant info
chatSchema.methods.getParticipantInfo = function(userId) {
  return this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
};

// Instance method to update last activity
chatSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Static method to find chats for user
chatSchema.statics.findUserChats = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    'participants.user': userId,
    isActive: true
  })
  .populate('participants.user', 'name email avatar isOnline lastSeen')
  .populate('lastMessage', 'content sender createdAt type')
  .sort({ lastActivity: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to create private chat
chatSchema.statics.createPrivateChat = async function(user1Id, user2Id) {
  // Check if private chat already exists
  const existingChat = await this.findOne({
    type: 'private',
    'participants.user': { $all: [user1Id, user2Id] },
    isActive: true
  });
  
  if (existingChat) {
    return existingChat;
  }
  
  // Create new private chat
  const chat = new this({
    type: 'private',
    participants: [
      { user: user1Id, role: 'member' },
      { user: user2Id, role: 'member' }
    ]
  });
  
  return await chat.save();
};

// Static method to create group chat
chatSchema.statics.createGroupChat = async function(name, description, creatorId, participantIds = []) {
  const chat = new this({
    name,
    description,
    type: 'group',
    participants: [
      { user: creatorId, role: 'owner' },
      ...participantIds.map(id => ({ user: id, role: 'member' }))
    ]
  });
  
  return await chat.save();
};

module.exports = mongoose.model('Chat', chatSchema);
