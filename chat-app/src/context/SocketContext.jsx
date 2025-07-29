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

  useEffect(() => {
    if (user) {
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
    } else {
      // Disconnect when user logs out
      socketService.disconnect();
      setIsConnected(false);
      setOnlineUsers([]);
    }
  }, [user]);

  const value = {
    socket: socketService,
    isConnected,
    onlineUsers,
    
    // Chat methods
    joinChat: (chatId) => socketService.joinChat(chatId),
    leaveChat: (chatId) => socketService.leaveChat(chatId),
    sendMessage: (chatId, content, type, replyTo) => 
      socketService.sendMessage(chatId, content, type, replyTo),
    
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
