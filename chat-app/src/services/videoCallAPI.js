import api from './api';

export const videoCallAPI = {
  // Get Stream.io configuration and user token
  getConfig: () => api.get('/video-calls/config'),

  // Create a new video call
  createCall: (chatId, callType = 'default') => 
    api.post('/video-calls/create', { chatId, callType }),

  // Join an existing video call
  joinCall: (callType, callId) => 
    api.get(`/video-calls/join/${callType}/${callId}`),

  // End a video call
  endCall: (callType, callId) => 
    api.post(`/video-calls/end/${callType}/${callId}`),

  // Add members to a call
  addMembers: (callType, callId, userIds) => 
    api.post(`/video-calls/add-members/${callType}/${callId}`, { userIds }),

  // Remove members from a call
  removeMembers: (callType, callId, userIds) => 
    api.post(`/video-calls/remove-members/${callType}/${callId}`, { userIds }),

  // Get call status
  getCallStatus: (callType, callId) => 
    api.get(`/video-calls/status/${callType}/${callId}`)
};
