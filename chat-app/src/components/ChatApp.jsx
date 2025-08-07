import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageService } from '../services/MessageService'
import { useAuth } from '../App'
import { useSocket } from '../context/SocketContext'
import { useStreamVideo } from '../context/StreamVideoContext'
import { chatsAPI, messagesAPI, usersAPI, friendsAPI, videoCallAPI } from '../services/api'
import { VideoCallInvitation, VideoCallNotification } from './VideoCallInvitation'
import {
  MessageCircle,
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  LogOut,
  Settings,
  Users,
  Plus,
  ArrowLeft,
  Menu,
  UserPlus,
  MessageSquare,
  X,
  Edit3,
  Trash2,
  Reply,
  MoreHorizontal,
  User,
  Mail,
  Calendar,
  Clock,
  Shield,
  UserX,
  Volume2,
  VolumeX,
  Flag,
  Info
} from 'lucide-react'

const ChatApp = () => {
  const { user, logout } = useAuth()
  const { socket, isConnected, onlineUsers, joinChat, leaveChat, sendMessage } = useSocket()
  const { createCall, isInitialized: isVideoInitialized, error: videoError } = useStreamVideo()

  // Debug video initialization
  console.log('🎥 Video initialized:', isVideoInitialized, 'Error:', videoError)
  const queryClient = useQueryClient()

  const [selectedChat, setSelectedChat] = useState(null)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showFriendsList, setShowFriendsList] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [showFriendRequests, setShowFriendRequests] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [editingMessage, setEditingMessage] = useState(null)
  const [editText, setEditText] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(null)
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [videoCallInvitation, setVideoCallInvitation] = useState(null)
  const [videoCallNotifications, setVideoCallNotifications] = useState([])
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const userInfoRef = useRef(null)

  // Fetch user's chats
  const { data: chats = [], isLoading: chatsLoading, refetch: refetchChats } = useQuery({
    queryKey: ['chats'],
    queryFn: () => chatsAPI.getChats().then(res => res.data.chats),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch friends list
  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: () => usersAPI.getFriends().then(res => res.data.friends),
  })

  // Fetch friend requests
  const { data: friendRequests = { sent: [], received: [] }, refetch: refetchFriendRequests } = useQuery({
    queryKey: ['friendRequests'],
    queryFn: () => usersAPI.getFriendRequests().then(res => res.data),
  })

  // Fetch messages for selected chat
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedChat?._id],
    queryFn: () => selectedChat ? MessageService.getMessages(selectedChat._id).then(res => res.messages) : Promise.resolve([]),
    enabled: !!selectedChat,
  })

  // Search users mutation
  const { data: searchResults = [], mutate: searchUsers, isLoading: searchLoading } = useMutation({
    mutationFn: (query) => usersAPI.searchUsers(query).then(res => res.data.users),
  })

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: (userId) => friendsAPI.sendFriendRequest(userId),
    onSuccess: (response, userId) => {
      queryClient.invalidateQueries(['friends'])
      queryClient.invalidateQueries(['friendRequests'])

      // Send real-time notification via Socket.IO
      if (socket && isConnected) {
        socket.sendFriendRequestNotification(userId, {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        })
      }

      alert('Friend request sent!')
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to send friend request')
    }
  })

  // Accept friend request mutation
  const acceptFriendRequestMutation = useMutation({
    mutationFn: (userId) => {
      console.log('Accepting friend request for user ID:', userId);
      return friendsAPI.acceptFriendRequest(userId);
    },
    onSuccess: (response, userId) => {
      queryClient.invalidateQueries(['friends'])
      queryClient.invalidateQueries(['friendRequests'])

      // Send real-time notification via Socket.IO
      if (socket && isConnected) {
        socket.sendFriendRequestResponse(userId, 'accepted', {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        })
      }

      alert('Friend request accepted!')
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to accept friend request')
    }
  })

  // Reject friend request mutation
  const rejectFriendRequestMutation = useMutation({
    mutationFn: (userId) => friendsAPI.rejectFriendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['friendRequests'])
      alert('Friend request rejected')
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to reject friend request')
    }
  })

  // Create private chat mutation
  const createPrivateChatMutation = useMutation({
    mutationFn: (userId) => chatsAPI.createPrivateChat(userId),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['chats'])
      setSelectedChat(response.data.chat)
      setShowFriendsList(false)
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to create chat')
    }
  })

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: ({ messageId, content }) => messagesAPI.editMessage(messageId, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedChat._id])
      setEditingMessage(null)
      setEditText('')
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to edit message')
    }
  })

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId) => messagesAPI.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedChat._id])
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to delete message')
    }
  })

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }) => messagesAPI.addReaction(messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedChat._id])
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to add reaction')
    }
  })

  // Remove reaction mutation
  const removeReactionMutation = useMutation({
    mutationFn: (messageId) => messagesAPI.removeReaction(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedChat._id])
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to remove reaction')
    }
  })

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket || !isConnected) return

    // Handle new messages
    const handleNewMessage = (data) => {
      if (data.chatId === selectedChat?._id) {
        queryClient.setQueryData(['messages', data.chatId], (oldMessages = []) => [
          ...oldMessages,
          data.message
        ])
      }
      // Update chat list to show new last message
      queryClient.invalidateQueries(['chats'])
    }

    // Handle typing indicators
    const handleUserTyping = (data) => {
      if (data.chatId === selectedChat?._id && data.userId !== user._id) {
        setTypingUsers(prev => new Set([...prev, data.userId]))
      }
    }

    const handleUserStoppedTyping = (data) => {
      if (data.chatId === selectedChat?._id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
      }
    }

    // Handle message reactions
    const handleMessageReaction = (data) => {
      if (selectedChat?._id) {
        // Update the specific message with the new reaction
        queryClient.setQueryData(['messages', selectedChat._id], (oldMessages = []) => {
          return oldMessages.map(msg => {
            if (msg._id === data.messageId) {
              const updatedReactions = [...(msg.reactions || [])]

              if (data.action === 'add') {
                // Add or update reaction
                const existingIndex = updatedReactions.findIndex(r => r.user._id === data.userId)
                if (existingIndex >= 0) {
                  updatedReactions[existingIndex].emoji = data.emoji
                } else {
                  updatedReactions.push({
                    user: { _id: data.userId },
                    emoji: data.emoji,
                    createdAt: new Date()
                  })
                }
              } else if (data.action === 'remove') {
                // Remove reaction
                const filteredReactions = updatedReactions.filter(r => r.user._id !== data.userId)
                return { ...msg, reactions: filteredReactions }
              }

              return { ...msg, reactions: updatedReactions }
            }
            return msg
          })
        })
      }
    }

    // Handle read receipts
    const handleMessagesRead = (data) => {
      if (data.chatId === selectedChat?._id) {
        queryClient.invalidateQueries(['messages', selectedChat._id])
      }
    }

    // Handle friend request notifications
    const handleFriendRequestReceived = (data) => {
      queryClient.invalidateQueries(['friendRequests'])
      // Show notification
      alert(`Friend request received from ${data.from.name}!`)
    }

    const handleFriendRequestResponded = (data) => {
      queryClient.invalidateQueries(['friendRequests'])
      queryClient.invalidateQueries(['friends'])
      // Show notification
      if (data.response === 'accepted') {
        alert(`${data.from.name} accepted your friend request!`)
      }
    }

    // Handle video call invitations
    const handleVideoCallInvitation = (data) => {
      setVideoCallInvitation(data)
    }

    // Handle video call responses
    const handleVideoCallResponse = (data) => {
      const notification = {
        id: Date.now(),
        type: data.response === 'accepted' ? 'call_accepted' : 'call_declined',
        message: `${data.respondedBy.name} ${data.response} your video call`
      }
      setVideoCallNotifications(prev => [...prev, notification])
    }

    // Handle video call ended notifications
    const handleVideoCallEnded = (data) => {
      const notification = {
        id: Date.now(),
        type: 'call_ended',
        message: `Video call ended by ${data.endedBy.name}`
      }
      setVideoCallNotifications(prev => [...prev, notification])
    }

    // Register event listeners
    socket.on('new_message', handleNewMessage)
    socket.on('user_typing', handleUserTyping)
    socket.on('user_stopped_typing', handleUserStoppedTyping)
    socket.on('message_reaction', handleMessageReaction)
    socket.on('messages_read', handleMessagesRead)
    socket.on('friend_request_received', handleFriendRequestReceived)
    socket.on('friend_request_responded', handleFriendRequestResponded)
    socket.on('video_call_invitation', handleVideoCallInvitation)
    socket.on('video_call_response_received', handleVideoCallResponse)
    socket.on('video_call_ended_notification', handleVideoCallEnded)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('user_typing', handleUserTyping)
      socket.off('user_stopped_typing', handleUserStoppedTyping)
      socket.off('message_reaction', handleMessageReaction)
      socket.off('messages_read', handleMessagesRead)
      socket.off('friend_request_received', handleFriendRequestReceived)
      socket.off('friend_request_responded', handleFriendRequestResponded)
      socket.off('video_call_invitation', handleVideoCallInvitation)
      socket.off('video_call_response_received', handleVideoCallResponse)
      socket.off('video_call_ended_notification', handleVideoCallEnded)
    }
  }, [socket, isConnected, selectedChat, user._id, queryClient])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Join/leave chat rooms when selected chat changes
  useEffect(() => {
    if (selectedChat && socket && isConnected) {
      joinChat(selectedChat._id)

      return () => {
        leaveChat(selectedChat._id)
      }
    }
  }, [selectedChat, socket, isConnected, joinChat, leaveChat])

  // Handle clicking outside user info dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userInfoRef.current && !userInfoRef.current.contains(event.target)) {
        setShowUserInfo(false)
      }
    }

    if (showUserInfo) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showUserInfo])

  // Handle sending messages
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (message.trim() && selectedChat) {
      try {
        console.log('Sending message via API...');
        // Send via MessageService for API delivery
        const messageType = 'text'
        const replyTo = replyToMessage?._id || null

        await MessageService.sendMessage(selectedChat._id, message.trim(), messageType, replyTo)
        
        // Also send via Socket.IO for real-time delivery if connected
        if (socket && isConnected) {
          console.log('Socket connected, sending via socket too');
          sendMessage(selectedChat._id, message.trim(), messageType, replyTo)
        } else {
          console.log('Socket not connected, refreshing via query invalidation');
          // If socket is not connected, manually refresh messages
          queryClient.invalidateQueries(['messages', selectedChat._id])
          queryClient.invalidateQueries(['chats'])
        }
        
        setMessage('')
        setReplyToMessage(null)
        
        // Stop typing indicator
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = null
        }
        if (socket && isConnected) {
          socket.stopTyping(selectedChat._id)
        }

        // Refresh messages
        queryClient.invalidateQueries(['messages', selectedChat._id])
        
        // Show visual feedback that message was sent successfully
        console.log('Message sent successfully');
      } catch (error) {
        console.error('Error sending message:', error)
        alert('Failed to send message: ' + (error.response?.data?.error || error.message || 'Unknown error'))
      }
    }
  }

  // Handle editing message
  const handleEditMessage = (msg) => {
    setEditingMessage(msg._id)
    setEditText(msg.content)
  }

  // Handle saving edited message
  const handleSaveEdit = () => {
    if (editText.trim() && editingMessage) {
      editMessageMutation.mutate({
        messageId: editingMessage,
        content: editText.trim()
      })
    }
  }

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingMessage(null)
    setEditText('')
  }

  // Handle deleting message
  const handleDeleteMessage = (messageId) => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMessageMutation.mutate(messageId)
    }
  }

  // Handle adding reaction
  const handleAddReaction = (messageId, emoji) => {
    addReactionMutation.mutate({ messageId, emoji })
    setShowEmojiPicker(null)

    // Also send via Socket.IO for real-time updates
    if (socket && isConnected) {
      socket.addReaction(messageId, emoji)
    }
  }

  // Handle removing reaction
  const handleRemoveReaction = (messageId) => {
    removeReactionMutation.mutate(messageId)

    // Also send via Socket.IO for real-time updates
    if (socket && isConnected) {
      socket.removeReaction(messageId)
    }
  }

  // Handle replying to message
  const handleReplyToMessage = (msg) => {
    setReplyToMessage(msg)
    // Focus on input (you can add a ref to the input if needed)
  }

  // Handle starting video call
  const handleStartVideoCall = async () => {
    if (!selectedChat) {
      alert('Please select a chat first')
      return
    }

    if (!isVideoInitialized) {
      if (videoError) {
        alert(`Video calling not available: ${videoError}`)
      } else {
        alert('Video calling is still initializing, please try again in a moment')
      }
      return
    }

    try {
      // Create video call
      const { call, callData } = await createCall(selectedChat._id)

      // Get participant user IDs
      const participantIds = selectedChat.participants
        .filter(p => p.user && p.user._id) // Filter out null users first
        .map(p => p.user._id)
        .filter(id => id !== user._id)

      // Send invitation via Socket.IO
      if (socket && isConnected) {
        socket.emit('send_video_call_invitation', {
          chatId: selectedChat._id,
          callId: callData.call_id,
          callType: callData.call_type,
          invitedUserIds: participantIds
        })
      }

      // Navigate to video call
      window.open(`/video-call/${callData.call_type}/${callData.call_id}`, '_blank')

    } catch (error) {
      console.error('Error starting video call:', error)
      alert('Failed to start video call')
    }
  }

  // Handle accepting video call invitation
  const handleAcceptVideoCall = () => {
    if (videoCallInvitation && socket) {
      socket.emit('video_call_response', {
        callId: videoCallInvitation.callId,
        response: 'accepted',
        invitedBy: videoCallInvitation.invitedBy._id
      })
    }
    setVideoCallInvitation(null)
  }

  // Handle declining video call invitation
  const handleDeclineVideoCall = () => {
    if (videoCallInvitation && socket) {
      socket.emit('video_call_response', {
        callId: videoCallInvitation.callId,
        response: 'declined',
        invitedBy: videoCallInvitation.invitedBy._id
      })
    }
    setVideoCallInvitation(null)
  }

  // Handle removing video call notification
  const handleRemoveNotification = (notificationId) => {
    setVideoCallNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    )
  }

  // Common emojis for quick reactions
  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥', '💯', '🎉']

  // Handle typing indicators
  const handleTyping = (e) => {
    setMessage(e.target.value)

    if (selectedChat && socket && isConnected) {
      // Start typing indicator
      socket.startTyping(selectedChat._id)

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.stopTyping(selectedChat._id)
      }, 2000)
    }
  }

  // Handle user search
  const handleUserSearch = (e) => {
    const query = e.target.value
    setUserSearchTerm(query)

    if (query.trim().length > 0) {
      searchUsers(query.trim())
    }
  }

  // Handle chat selection
  const handleChatSelect = (chat) => {
    setSelectedChat(chat)
    setIsSidebarOpen(false)

    // Mark messages as read when opening chat
    if (chat.unreadCount > 0) {
      // This will be implemented when we have the message IDs
      // markMessagesAsRead(chat._id)
    }
  }

  // Handle creating chat with friend
  const handleCreateChatWithFriend = (friend) => {
    // Handle both id and _id properties to ensure compatibility
    const friendId = friend.id || friend._id;
    console.log('Creating chat with friend ID:', friendId);
    
    if (!friendId) {
      console.error('Friend object missing ID:', friend);
      alert('Unable to create chat: Invalid friend data');
      return;
    }
    
    createPrivateChatMutation.mutate(friendId);
  }

  // Handle sending friend request
  const handleSendFriendRequest = (user) => {
    sendFriendRequestMutation.mutate(user._id)
  }

  // Handle accepting friend request
  const handleAcceptFriendRequest = (user) => {
    // Fix the issue with id vs _id mismatch
    const userId = user.id || user._id;
    if (!userId) {
      console.error('Failed to accept friend request: Missing user ID', user);
      return;
    }
    acceptFriendRequestMutation.mutate(userId);
  }

  // Handle rejecting friend request
  const handleRejectFriendRequest = (user) => {
    // Fix the issue with id vs _id mismatch
    const userId = user.id || user._id;
    if (!userId) {
      console.error('Failed to reject friend request: Missing user ID', user);
      return;
    }
    rejectFriendRequestMutation.mutate(userId);
  }

  // Filter chats based on search term
  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.participants?.some(p =>
      p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Get online status for a user
  const isUserOnline = (userId) => {
    return onlineUsers.some(u => u.userId === userId)
  }

  // Format time for display
  const formatTime = (date) => {
    if (!date) return ''
    const messageDate = new Date(date)
    const now = new Date()
    const diffInHours = (now - messageDate) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60))
      return diffInMinutes < 1 ? 'now' : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return messageDate.toLocaleDateString()
    }
  }

  // Get chat display name
  const getChatDisplayName = (chat) => {
    if (chat.type === 'group') {
      return chat.name
    }
    // For private chats, show the other participant's name
    const otherParticipant = chat.participants?.find(p => p.user && p.user._id !== user._id)
    return otherParticipant?.user?.name || 'Unknown User'
  }

  // Get chat avatar
  const getChatAvatar = (chat) => {
    if (chat.type === 'group') {
      return chat.avatar
    }
    // For private chats, show the other participant's avatar
    const otherParticipant = chat.participants?.find(p => p.user && p.user._id !== user._id)
    return otherParticipant?.user?.avatar || 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff&size=128'
  }

  // Check if chat has online users
  const isChatOnline = (chat) => {
    if (chat.type === 'group') {
      return chat.participants?.some(p => p.user && p.user._id !== user._id && isUserOnline(p.user._id))
    }
    const otherParticipant = chat.participants?.find(p => p.user && p.user._id !== user._id)
    return otherParticipant ? isUserOnline(otherParticipant.user._id) : false
  }

  // Get detailed user info for the selected chat
  const getChatUserInfo = (chat) => {
    if (!chat) return null

    if (chat.type === 'group') {
      return {
        type: 'group',
        name: chat.name,
        description: chat.description || 'No description',
        memberCount: chat.participants?.length || 0,
        members: chat.participants || [],
        createdAt: chat.createdAt,
        avatar: chat.avatar
      }
    } else {
      // For private chats, get the other participant's info
      const otherParticipant = chat.participants?.find(p => p.user && p.user._id !== user._id)
      if (!otherParticipant) return null

      const otherUser = otherParticipant.user
      return {
        type: 'private',
        name: otherUser.name,
        email: otherUser.email,
        avatar: otherUser.avatar,
        isOnline: isUserOnline(otherUser._id),
        lastSeen: otherUser.lastSeen,
        joinedAt: otherUser.createdAt,
        bio: otherUser.bio || 'No bio available',
        userId: otherUser._id
      }
    }
  }

  // Format last seen time
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never'
    const date = new Date(lastSeen)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:relative z-50 w-80 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out h-full`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-green-600">Online</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Connection Status */}
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                   title={isConnected ? 'Connected' : 'Disconnected'}>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-2 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setShowFriendsList(!showFriendsList)}
              className="flex flex-col items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4 mb-1" />
              <span className="text-xs">Friends</span>
            </button>
            <button
              onClick={() => setShowFriendRequests(!showFriendRequests)}
              className="flex flex-col items-center justify-center p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors relative"
            >
              <Users className="w-4 h-4 mb-1" />
              <span className="text-xs">Requests</span>
              {friendRequests.received.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {friendRequests.received.length}
                </div>
              )}
            </button>
            <button
              onClick={() => setShowUserSearch(!showUserSearch)}
              className="flex flex-col items-center justify-center p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4 mb-1" />
              <span className="text-xs">Add</span>
            </button>
          </div>
        </div>

        {/* Friends List Modal */}
        {showFriendsList && (
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Your Friends</h3>
              <button
                onClick={() => setShowFriendsList(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {friends.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No friends yet. Add some friends to start chatting!</p>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend._id}
                    onClick={() => handleCreateChatWithFriend(friend)}
                    className="flex items-center p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-8 h-8 rounded-full"
                      />
                      {isUserOnline(friend._id) && (
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{friend.name}</p>
                      <p className="text-xs text-gray-500">
                        {isUserOnline(friend._id) ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Friend Requests Modal */}
        {showFriendRequests && (
          <div className="p-4 border-b border-gray-200 bg-purple-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Friend Requests</h3>
              <button
                onClick={() => setShowFriendRequests(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Received Requests */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Received ({friendRequests.received.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {friendRequests.received.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No pending requests</p>
                ) : (
                  friendRequests.received.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center p-2 bg-white rounded-lg"
                    >
                      <img
                        src={request.avatar}
                        alt={request.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{request.name}</p>
                        <p className="text-xs text-gray-500">{request.email}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            console.log('Accepting friend request:', request);
                            handleAcceptFriendRequest(request);
                          }}
                          disabled={acceptFriendRequestMutation.isLoading}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectFriendRequest(request)}
                          disabled={rejectFriendRequestMutation.isLoading}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sent Requests */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Sent ({friendRequests.sent.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {friendRequests.sent.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No sent requests</p>
                ) : (
                  friendRequests.sent.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center p-2 bg-white rounded-lg"
                    >
                      <img
                        src={request.avatar}
                        alt={request.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{request.name}</p>
                        <p className="text-xs text-gray-500">Request pending...</p>
                      </div>
                      <span className="text-xs text-gray-400 px-2 py-1">
                        Pending
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Search Modal */}
        {showUserSearch && (
          <div className="p-4 border-b border-gray-200 bg-green-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Find Friends</h3>
              <button
                onClick={() => setShowUserSearch(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearchTerm}
                onChange={handleUserSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {searchLoading ? (
                <p className="text-sm text-gray-500 text-center py-4">Searching...</p>
              ) : searchResults.length === 0 && userSearchTerm ? (
                <p className="text-sm text-gray-500 text-center py-4">No users found</p>
              ) : (
                searchResults.map((searchUser) => (
                  <div
                    key={searchUser._id}
                    className="flex items-center p-2 hover:bg-white rounded-lg transition-colors"
                  >
                    <img
                      src={searchUser.avatar}
                      alt={searchUser.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{searchUser.name}</p>
                      <p className="text-xs text-gray-500">{searchUser.email}</p>
                    </div>
                    <button
                      onClick={() => handleSendFriendRequest(searchUser)}
                      disabled={sendFriendRequestMutation.isLoading}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                    >
                      Add Friend
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chatsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No chats yet</p>
              <p className="text-gray-400 text-xs mt-1">Add friends to start chatting!</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => handleChatSelect(chat)}
                className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                  selectedChat?._id === chat._id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="relative">
                  <img
                    src={getChatAvatar(chat)}
                    alt={getChatDisplayName(chat)}
                    className="w-12 h-12 rounded-full"
                  />
                  {isChatOnline(chat) && chat.type === 'private' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                  {chat.type === 'group' && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
                      <Users className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {getChatDisplayName(chat)}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatTime(chat.lastActivity)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {chat.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
                {chat.unreadCount > 0 && (
                  <div className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mr-2"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <img
                  src={getChatAvatar(selectedChat)}
                  alt={getChatDisplayName(selectedChat)}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{getChatDisplayName(selectedChat)}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedChat.type === 'group'
                      ? `${selectedChat.participants?.length || 0} members`
                      : isChatOnline(selectedChat)
                        ? 'Online'
                        : 'Offline'
                    }
                    {typingUsers.size > 0 && (
                      <span className="text-blue-600 ml-2">
                        {typingUsers.size === 1 ? 'typing...' : `${typingUsers.size} people typing...`}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleStartVideoCall}
                  disabled={!selectedChat}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    !selectedChat
                      ? "Select a chat to start audio call"
                      : !isVideoInitialized
                        ? `Audio calling unavailable: ${videoError || 'Initializing...'}`
                        : "Start audio call"
                  }
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={handleStartVideoCall}
                  disabled={!selectedChat}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    !selectedChat
                      ? "Select a chat to start video call"
                      : !isVideoInitialized
                        ? `Video calling unavailable: ${videoError || 'Initializing...'}`
                        : "Start video call"
                  }
                >
                  <Video className="w-5 h-5" />
                </button>

                {/* User Info Dropdown */}
                <div className="relative" ref={userInfoRef}>
                  <button
                    onClick={() => setShowUserInfo(!showUserInfo)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {/* User Info Dropdown Menu */}
                  {showUserInfo && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-dropdown-in">
                      {(() => {
                        const userInfo = getChatUserInfo(selectedChat)
                        if (!userInfo) return null

                        return (
                          <div className="p-4">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {userInfo.type === 'group' ? 'Group Info' : 'User Info'}
                              </h3>
                              <button
                                onClick={() => setShowUserInfo(false)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Avatar and Name */}
                            <div className="flex items-center space-x-4 mb-6">
                              <div className="relative">
                                <img
                                  src={userInfo.avatar || getChatAvatar(selectedChat)}
                                  alt={userInfo.name}
                                  className="w-16 h-16 rounded-full"
                                />
                                {userInfo.type === 'private' && userInfo.isOnline && (
                                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-xl font-semibold text-gray-900">{userInfo.name}</h4>
                                {userInfo.type === 'private' ? (
                                  <p className="text-sm text-gray-500">
                                    {userInfo.isOnline ? 'Online' : `Last seen ${formatLastSeen(userInfo.lastSeen)}`}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    {userInfo.memberCount} members
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* User Details */}
                            <div className="space-y-4">
                              {userInfo.type === 'private' ? (
                                <>
                                  {/* Email */}
                                  <div className="flex items-center space-x-3">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">Email</p>
                                      <p className="text-sm text-gray-600">{userInfo.email}</p>
                                    </div>
                                  </div>

                                  {/* Bio */}
                                  <div className="flex items-start space-x-3">
                                    <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">Bio</p>
                                      <p className="text-sm text-gray-600">{userInfo.bio}</p>
                                    </div>
                                  </div>

                                  {/* Joined Date */}
                                  <div className="flex items-center space-x-3">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">Joined</p>
                                      <p className="text-sm text-gray-600">
                                        {new Date(userInfo.joinedAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Last Seen */}
                                  <div className="flex items-center space-x-3">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">Last Seen</p>
                                      <p className="text-sm text-gray-600">
                                        {formatLastSeen(userInfo.lastSeen)}
                                      </p>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Group Description */}
                                  <div className="flex items-start space-x-3">
                                    <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">Description</p>
                                      <p className="text-sm text-gray-600">{userInfo.description}</p>
                                    </div>
                                  </div>

                                  {/* Created Date */}
                                  <div className="flex items-center space-x-3">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">Created</p>
                                      <p className="text-sm text-gray-600">
                                        {new Date(userInfo.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Members */}
                                  <div className="flex items-start space-x-3">
                                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">Members ({userInfo.memberCount})</p>
                                      <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                                        {userInfo.members.map((member) => (
                                          <div key={member.user._id} className="flex items-center space-x-2">
                                            <div className="relative">
                                              <img
                                                src={member.user.avatar}
                                                alt={member.user.name}
                                                className="w-6 h-6 rounded-full"
                                              />
                                              {isUserOnline(member.user._id) && (
                                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full"></div>
                                              )}
                                            </div>
                                            <span className="text-sm text-gray-600">{member.user.name}</span>
                                            {member.role === 'admin' && (
                                              <Shield className="w-3 h-3 text-blue-500" />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 pt-4 border-t border-gray-200">
                              <div className="flex space-x-2">
                                {userInfo.type === 'private' ? (
                                  <>
                                    <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                      <User className="w-4 h-4" />
                                      <span className="text-sm">View Profile</span>
                                    </button>
                                    <button className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                      <Volume2 className="w-4 h-4" />
                                    </button>
                                    <button className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                                      <UserX className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                      <Settings className="w-4 h-4" />
                                      <span className="text-sm">Group Settings</span>
                                    </button>
                                    <button className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                      <VolumeX className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-gray-400 text-sm mt-1">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMyMessage = msg.sender?._id === user._id
                  const isEditing = editingMessage === msg._id

                  return (
                    <div
                      key={msg._id}
                      className={`group flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md animate-fade-in ${
                        isMyMessage ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        {!isMyMessage && (
                          <img
                            src={msg.sender?.avatar || 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff&size=32'}
                            alt={msg.sender?.name || 'User'}
                            className="w-6 h-6 rounded-full"
                          />
                        )}

                        <div className="relative">
                          {/* Reply indicator */}
                          {msg.replyTo && (
                            <div className={`text-xs mb-1 p-2 rounded-lg border-l-2 ${
                              isMyMessage
                                ? 'bg-blue-400 border-blue-200 text-blue-100'
                                : 'bg-gray-100 border-gray-300 text-gray-600'
                            }`}>
                              <p className="font-medium">Replying to {msg.replyTo.sender?.name}</p>
                              <p className="truncate">{msg.replyTo.content}</p>
                            </div>
                          )}

                          <div
                            className={`px-4 py-2 rounded-2xl relative ${
                              isMyMessage
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            {!isMyMessage && selectedChat.type === 'group' && (
                              <p className="text-xs font-medium mb-1 opacity-75">
                                {msg.sender?.name}
                              </p>
                            )}

                            {/* Message content or edit input */}
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full bg-white text-gray-900 px-2 py-1 rounded text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit()
                                    if (e.key === 'Escape') handleCancelEdit()
                                  }}
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleSaveEdit}
                                    className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-xs bg-gray-600 text-white px-2 py-1 rounded"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm">{msg.content}</p>
                            )}

                            <div className="flex items-center justify-between mt-1">
                              <p className={`text-xs ${
                                isMyMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {msg.edited?.isEdited && (
                                <span className={`text-xs ml-2 ${
                                  isMyMessage ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  edited
                                </span>
                              )}
                            </div>

                            {/* Reactions */}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {msg.reactions.map((reaction, index) => {
                                  const userReacted = reaction.user._id === user._id
                                  return (
                                    <button
                                      key={index}
                                      onClick={() => userReacted ? handleRemoveReaction(msg._id) : null}
                                      className={`text-xs rounded-full px-2 py-1 transition-colors ${
                                        userReacted
                                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                          : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                                      }`}
                                    >
                                      {reaction.emoji} {reaction.count || 1}
                                    </button>
                                  )
                                })}
                              </div>
                            )}

                            {/* Message actions (visible on hover) */}
                            <div className={`absolute top-0 ${isMyMessage ? 'left-0' : 'right-0'} transform ${
                              isMyMessage ? '-translate-x-full' : 'translate-x-full'
                            } opacity-0 group-hover:opacity-100 transition-opacity`}>
                              <div className="flex items-center space-x-1 bg-white shadow-lg rounded-lg p-1 border">
                                {/* Emoji reaction button */}
                                <button
                                  onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)}
                                  className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                  title="Add reaction"
                                >
                                  <Smile className="w-4 h-4" />
                                </button>

                                {/* Reply button */}
                                <button
                                  onClick={() => handleReplyToMessage(msg)}
                                  className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                  title="Reply"
                                >
                                  <Reply className="w-4 h-4" />
                                </button>

                                {/* Edit button (only for own messages) */}
                                {isMyMessage && !isEditing && (
                                  <button
                                    onClick={() => handleEditMessage(msg)}
                                    className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Delete button (only for own messages) */}
                                {isMyMessage && (
                                  <button
                                    onClick={() => handleDeleteMessage(msg._id)}
                                    className="p-1 hover:bg-red-100 rounded text-red-600"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Emoji picker */}
                            {showEmojiPicker === msg._id && (
                              <div className="absolute bottom-full mb-2 left-0 bg-white shadow-lg rounded-lg p-2 border z-10">
                                <div className="grid grid-cols-5 gap-1">
                                  {commonEmojis.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleAddReaction(msg._id, emoji)}
                                      className="p-2 hover:bg-gray-100 rounded text-lg"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Indicator */}
            {replyToMessage && (
              <div className="bg-blue-50 border-t border-blue-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Reply className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600">
                      Replying to {replyToMessage.sender?.name || 'Unknown'}
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyToMessage(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {replyToMessage.content}
                </p>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={handleTyping}
                    placeholder={
                      !selectedChat
                        ? "Select a chat to start messaging..."
                        : "Type a message..."
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!selectedChat}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!message.trim() || !selectedChat}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            {/* Mobile Menu Button for Welcome Screen */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg shadow-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="text-center animate-fade-in">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to ChatChout</h3>
              <p className="text-gray-600">Select a conversation to start messaging</p>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Open Chats
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Call Invitation Modal */}
      {videoCallInvitation && (
        <VideoCallInvitation
          invitation={videoCallInvitation}
          onAccept={handleAcceptVideoCall}
          onDecline={handleDeclineVideoCall}
          onClose={() => setVideoCallInvitation(null)}
        />
      )}

      {/* Video Call Notifications */}
      {videoCallNotifications.map((notification) => (
        <VideoCallNotification
          key={notification.id}
          notification={notification}
          onClose={() => handleRemoveNotification(notification.id)}
        />
      ))}
    </div>
  )
}

export default ChatApp
