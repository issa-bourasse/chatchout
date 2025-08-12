import { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socket';
import { useAuth } from '../App';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socketEnabled, setSocketEnabled] = useState(false);

  // Enable socket for development and production (Railway supports WebSockets)
  useEffect(() => {
    if (user) {
      const isLocalhost = window.location.hostname === 'localhost';
      const hasSocketUrl = import.meta.env.VITE_SOCKET_URL;

      console.log('🔌 Socket.IO check - hostname:', window.location.hostname);
      console.log('🔌 Socket URL configured:', hasSocketUrl);

      // Enable sockets if we're in localhost OR if we have a socket URL configured (Railway)
      if (isLocalhost || hasSocketUrl) {
        console.log('✅ Enabling Socket.IO - Railway backend supports WebSockets');
        setSocketEnabled(true);
      } else {
        console.log('❌ Disabling Socket.IO - No socket URL configured');
        setSocketEnabled(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && socketEnabled) {
      console.log('🔌 Socket is enabled, connecting...');
      console.log('🔌 User:', user.name, 'ID:', user._id);
      console.log('🔌 Socket URL:', import.meta.env.VITE_SOCKET_URL);

      // Connect to socket when user is authenticated
      socketService.connect();

      // Set up event listeners
      socketService.on('online_users', (users) => {
        setOnlineUsers(users);
      });

      socketService.on('friend_online', (data) => {
        setOnlineUsers(prev => {
          const updated = prev.filter(u => u.userId !== data.userId);
          return [...updated, { ...data, isOnline: true }];
        });
      });

      socketService.on('friend_offline', (data) => {
        setOnlineUsers(prev => 
          prev.map(u => 
            u.userId === data.userId 
              ? { ...u, isOnline: false, lastSeen: data.lastSeen }
              : u
          )
        );
      });

      // Monitor connection status
      const checkConnection = () => {
        setIsConnected(socketService.isSocketConnected());
      };

      const interval = setInterval(checkConnection, 1000);
      checkConnection();

      return () => {
        clearInterval(interval);
        socketService.disconnect();
        setIsConnected(false);
        setOnlineUsers([]);
      };
    } else if (user && !socketEnabled) {
      console.log('Socket is disabled by server config');
      setIsConnected(false);
      setOnlineUsers([]);
    } else {
      // Disconnect when user logs out
      socketService.disconnect();
      setIsConnected(false);
      setOnlineUsers([]);
    }
  }, [user, socketEnabled]);

  const value = {
    socket: socketService,
    isConnected,
    onlineUsers,
    socketEnabled,
    
    // Chat methods
    joinChat: (chatId) => socketEnabled ? socketService.joinChat(chatId) : Promise.resolve(),
    leaveChat: (chatId) => socketEnabled ? socketService.leaveChat(chatId) : Promise.resolve(),
    sendMessage: (chatId, content, type, replyTo) => 
      socketEnabled ? socketService.sendMessage(chatId, content, type, replyTo) : Promise.resolve(),
    
    // Typing indicators
    startTyping: (chatId) => socketService.startTyping(chatId),
    stopTyping: (chatId) => socketService.stopTyping(chatId),
    
    // Message reactions
    addReaction: (messageId, emoji) => socketService.addReaction(messageId, emoji),
    
    // Message read receipts
    markMessagesRead: (chatId, messageIds) => 
      socketService.markMessagesRead(chatId, messageIds),
    
    // Friend requests
    sendFriendRequestNotification: (targetUserId, senderInfo) =>
      socketService.sendFriendRequestNotification(targetUserId, senderInfo),
    
    sendFriendRequestResponse: (targetUserId, response, userInfo) =>
      socketService.sendFriendRequestResponse(targetUserId, response, userInfo),
    
    // Group invitations
    sendGroupInvitation: (targetUserIds, groupInfo, inviterInfo) =>
      socketService.sendGroupInvitation(targetUserIds, groupInfo, inviterInfo),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
