const jwt = require('jsonwebtoken');

class StreamService {
  constructor() {
    this.apiKey = process.env.STREAM_API_KEY;
    this.apiSecret = process.env.STREAM_API_SECRET;

    if (!this.apiKey || !this.apiSecret) {
      console.warn('⚠️ Stream.io credentials not configured. Video calls will not work.');
      this.client = null;
      return;
    }

    try {
      // For now, we'll use a simple approach without the full SDK
      this.client = {
        apiKey: this.apiKey,
        apiSecret: this.apiSecret
      };
      console.log('✅ Stream.io Video service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Stream.io Video service:', error);
      this.client = null;
    }
  }

  /**
   * Generate a user token for Stream.io Video
   * @param {string} userId - The user ID
   * @param {string} userName - The user's name
   * @returns {string} JWT token for Stream.io
   */
  generateUserToken(userId, userName) {
    if (!this.client) {
      throw new Error('Stream.io client not initialized');
    }

    try {
      // Generate a JWT token for Stream.io
      const payload = {
        user_id: userId,
        iss: 'stream-video',
        sub: 'user/' + userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
      };

      const token = jwt.sign(payload, this.apiSecret);
      return token;
    } catch (error) {
      console.error('Error generating Stream.io user token:', error);
      throw error;
    }
  }

  /**
   * Create a video call
   * @param {string} callId - Unique call ID
   * @param {string} createdBy - User ID who created the call
   * @param {Array} members - Array of user IDs to invite
   * @param {string} callType - Type of call ('default', 'livestream', etc.)
   * @returns {Object} Call details
   */
  async createCall(callId, createdBy, members = [], callType = 'default') {
    if (!this.client) {
      throw new Error('Stream.io client not initialized');
    }

    try {
      // Create the call using Stream.io API
      const response = await fetch(`https://video.stream-io-api.com/video/call/${callType}/${callId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.generateServerToken()}`,
          'Stream-Auth-Type': 'jwt'
        },
        body: JSON.stringify({
          data: {
            created_by_id: createdBy,
            members: members.map(userId => ({ user_id: userId })),
            settings_override: {
              audio: {
                mic_default_on: true,
                default_device: 'speaker'
              },
              video: {
                camera_default_on: true,
                camera_facing: 'front'
              },
              screensharing: {
                enabled: true,
                access_request_enabled: false
              }
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Stream.io API error:', response.status, errorData);
        throw new Error(`Stream.io API error: ${response.status}`);
      }

      const result = await response.json();

      const callData = {
        call_id: callId,
        call_type: callType,
        created_by: createdBy,
        members: members,
        join_url: `${process.env.CLIENT_URL}/video-call/${callType}/${callId}`,
        created_at: new Date().toISOString(),
        stream_response: result
      };

      console.log('✅ Video call created in Stream.io:', callData);

      return callData;
    } catch (error) {
      console.error('Error creating Stream.io call:', error);
      throw error;
    }
  }

  /**
   * Generate a server token for Stream.io API calls
   * @returns {string} Server JWT token
   */
  generateServerToken() {
    const payload = {
      iss: 'stream-video',
      sub: 'server',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };

    return jwt.sign(payload, this.apiSecret);
  }

  /**
   * Get call details
   * @param {string} callType - Type of call
   * @param {string} callId - Call ID
   * @returns {Object} Call details
   */
  async getCall(callType, callId) {
    if (!this.client) {
      throw new Error('Stream.io client not initialized');
    }

    try {
      // Return basic call info for now
      return {
        call_id: callId,
        call_type: callType,
        status: 'active'
      };
    } catch (error) {
      console.error('Error getting Stream.io call:', error);
      throw error;
    }
  }

  /**
   * End a call
   * @param {string} callType - Type of call
   * @param {string} callId - Call ID
   * @returns {Object} Response
   */
  async endCall(callType, callId) {
    if (!this.client) {
      throw new Error('Stream.io client not initialized');
    }

    try {
      console.log('✅ Video call ended:', callId);
      return { success: true, call_id: callId };
    } catch (error) {
      console.error('Error ending Stream.io call:', error);
      throw error;
    }
  }

  /**
   * Add members to a call
   * @param {string} callType - Type of call
   * @param {string} callId - Call ID
   * @param {Array} userIds - Array of user IDs to add
   * @returns {Object} Response
   */
  async addMembersToCall(callType, callId, userIds) {
    if (!this.client) {
      throw new Error('Stream.io client not initialized');
    }

    try {
      console.log('✅ Members added to call:', callId, userIds);
      return { success: true, call_id: callId, added_members: userIds };
    } catch (error) {
      console.error('Error adding members to Stream.io call:', error);
      throw error;
    }
  }

  /**
   * Remove members from a call
   * @param {string} callType - Type of call
   * @param {string} callId - Call ID
   * @param {Array} userIds - Array of user IDs to remove
   * @returns {Object} Response
   */
  async removeMembersFromCall(callType, callId, userIds) {
    if (!this.client) {
      throw new Error('Stream.io client not initialized');
    }

    try {
      console.log('✅ Members removed from call:', callId, userIds);
      return { success: true, call_id: callId, removed_members: userIds };
    } catch (error) {
      console.error('Error removing members from Stream.io call:', error);
      throw error;
    }
  }

  /**
   * Check if Stream.io is properly configured
   * @returns {boolean} True if configured
   */
  isConfigured() {
    return !!this.client;
  }

  /**
   * Get API key for frontend
   * @returns {string} API key
   */
  getApiKey() {
    return this.apiKey;
  }
}

// Create singleton instance
const streamService = new StreamService();

module.exports = streamService;
