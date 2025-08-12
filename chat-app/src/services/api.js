import axios from 'axios';

// Determine the base URL based on the environment
const determineBaseUrl = () => {
  // First try environment variable (this should always be set in production)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Fallback for local development
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5000/api';
  }

  // If no environment variable is set in production, show error
  console.error('❌ VITE_API_URL environment variable not set!');
  throw new Error('API URL not configured. Please set VITE_API_URL environment variable.');
};

const API_BASE_URL = determineBaseUrl();
console.log('Using API base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to true if you need cookies to be sent
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

// Users API
export const usersAPI = {
  searchUsers: (query, limit = 10) => api.get(`/users/search?q=${query}&limit=${limit}`),
  getUserProfile: (userId) => api.get(`/users/${userId}`),
  getUsers: (page = 1, limit = 20) => api.get(`/users?page=${page}&limit=${limit}`),
  updateOnlineStatus: (isOnline) => api.put('/users/online-status', { isOnline }),
  getFriends: () => api.get('/users/me/friends'),
  getFriendRequests: () => api.get('/users/me/friend-requests'),
};

// Friends API
export const friendsAPI = {
  sendFriendRequest: (userId) => api.post('/friends/request', { userId }),
  acceptFriendRequest: (userId) => api.post('/friends/accept', { userId }),
  rejectFriendRequest: (userId) => api.post('/friends/reject', { userId }),
  removeFriend: (userId) => api.delete('/friends/remove', { data: { userId } }),
  cancelFriendRequest: (userId) => api.post('/friends/cancel-request', { userId }),
};

// Chats API
export const chatsAPI = {
  getChats: (page = 1, limit = 20) => api.get(`/chats?page=${page}&limit=${limit}`),
  createPrivateChat: (userId) => api.post('/chats/private', { userId }),
  createGroupChat: (name, description, participantIds) => 
    api.post('/chats/group', { name, description, participantIds }),
  getChat: (chatId) => api.get(`/chats/${chatId}`),
  inviteToGroup: (chatId, userIds) => api.post(`/chats/${chatId}/invite`, { userIds }),
  removeFromGroup: (chatId, userId) => api.delete(`/chats/${chatId}/participants/${userId}`),
  updateUserRole: (chatId, userId, role) => 
    api.put(`/chats/${chatId}/participants/${userId}/role`, { role }),
  updateGroupSettings: (chatId, settings) => api.put(`/chats/${chatId}/settings`, settings),
};

// Messages API
export const messagesAPI = {
  getMessages: (chatId, page = 1, limit = 50) => 
    api.get(`/messages/${chatId}?page=${page}&limit=${limit}`),
  sendMessage: (chatId, content, type = 'text', replyTo = null) => {
    const requestBody = { chatId, content, type };
    if (replyTo) requestBody.replyTo = replyTo;
    return api.post('/messages', requestBody);
  },
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
  markMultipleAsRead: (messageIds) => api.put('/messages/read-multiple', { messageIds }),
  addReaction: (messageId, emoji) => api.put(`/messages/${messageId}/react`, { emoji }),
  removeReaction: (messageId) => api.delete(`/messages/${messageId}/react`),
  editMessage: (messageId, content) => api.put(`/messages/${messageId}`, { content }),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const setUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Export video call API
export { videoCallAPI } from './videoCallAPI';

export default api;
