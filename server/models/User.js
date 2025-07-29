const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  avatar: {
    type: String,
    default: function() {
      // Generate a default avatar URL based on user's name
      const name = this.name || 'User';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;
    }
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters'],
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  friends: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  friendRequests: {
    sent: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      sentAt: {
        type: Date,
        default: Date.now
      }
    }],
    received: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      receivedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  blockedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    blockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ name: 'text', email: 'text' });

// Virtual for friend count
userSchema.virtual('friendCount').get(function() {
  return this.friends ? this.friends.length : 0;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.friendRequests;
  delete userObject.blockedUsers;
  return userObject;
};

// Instance method to get basic info for friend lists
userSchema.methods.getBasicInfo = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen
  };
};

// Static method to find users by search term
userSchema.statics.searchUsers = function(searchTerm, excludeUserId, limit = 10) {
  return this.find({
    $and: [
      { _id: { $ne: excludeUserId } },
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  })
  .select('name email avatar isOnline lastSeen')
  .limit(limit);
};

// Static method to update user online status
userSchema.statics.updateOnlineStatus = function(userId, isOnline) {
  return this.findByIdAndUpdate(
    userId,
    { 
      isOnline,
      lastSeen: new Date()
    },
    { new: true }
  );
};

module.exports = mongoose.model('User', userSchema);
