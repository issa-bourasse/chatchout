import React, { createContext, useContext, useState, useEffect } from 'react';
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk';
import { videoCallAPI } from '../services/videoCallAPI';
import { useAuth } from '../App';

const StreamVideoContext = createContext();

export const useStreamVideo = () => {
  const context = useContext(StreamVideoContext);
  if (!context) {
    throw new Error('useStreamVideo must be used within a StreamVideoProvider');
  }
  return context;
};

export const StreamVideoProvider = ({ children }) => {
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamConfig, setStreamConfig] = useState(null);

  useEffect(() => {
    const initializeStreamVideo = async () => {
      if (!user) {
        console.log('🎥 User not available yet, skipping Stream.io initialization');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🎥 Initializing Stream.io video for user:', user.name);

        // Get Stream.io configuration from backend
        const response = await videoCallAPI.getConfig();
        const config = response.data;

        console.log('🎥 Stream.io config received:', config);
        
        setStreamConfig(config);

        // Create Stream Video client
        const streamClient = new StreamVideoClient({
          apiKey: config.apiKey,
          user: {
            id: config.userId,
            name: config.userName,
            image: user.avatar
          },
          token: config.token,
        });

        setClient(streamClient);
        console.log('✅ Stream Video client initialized');

      } catch (error) {
        console.error('❌ Failed to initialize Stream Video:', error);
        console.error('❌ Error details:', error.response?.data || error.message);

        // Check if it's a configuration issue
        if (error.response?.status === 503) {
          setError('Video calling service not configured. Please set up Stream.io credentials.');
        } else {
          setError(error.response?.data?.message || 'Failed to initialize video calling');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeStreamVideo();

    // Cleanup function
    return () => {
      if (client) {
        client.disconnectUser();
        setClient(null);
      }
    };
  }, [user]);

  const createCall = async (chatId, callType = 'default') => {
    try {
      if (!client) {
        throw new Error('Stream Video client not initialized');
      }

      // Generate a unique call ID
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('🎥 Creating call with ID:', callId);

      // Get the call object from Stream client
      const call = client.call(callType, callId);

      // Create the call in Stream.io
      await call.getOrCreate({
        data: {
          created_by_id: streamConfig.userId,
          settings_override: {
            audio: {
              mic_default_on: true,
              default_device: 'speaker'
            },
            video: {
              camera_default_on: true,
              camera_facing: 'front',
              target_resolution: {
                width: 640,
                height: 480
              }
            },
            screensharing: {
              enabled: true,
              access_request_enabled: false
            }
          }
        }
      });

      console.log('✅ Call created successfully in Stream.io');

      const callData = {
        call_id: callId,
        call_type: callType,
        created_by: streamConfig.userId,
        join_url: `/video-call/${callType}/${callId}`
      };

      return {
        call,
        callData,
        joinUrl: callData.join_url
      };

    } catch (error) {
      console.error('Error creating call:', error);
      throw error;
    }
  };

  const joinCall = async (callType, callId) => {
    try {
      if (!client) {
        throw new Error('Stream Video client not initialized');
      }

      console.log('🎥 Joining call:', callType, callId);

      // Get the call object from Stream client
      const call = client.call(callType, callId);

      // Try to get the call info first, if it doesn't exist, create it
      try {
        await call.get();
        console.log('✅ Call exists, joining...');
      } catch (error) {
        console.log('📹 Call does not exist, creating it...');
        await call.getOrCreate({
          data: {
            created_by_id: streamConfig.userId,
            settings_override: {
              audio: {
                mic_default_on: true,
                default_device: 'speaker'
              },
              video: {
                camera_default_on: true,
                camera_facing: 'front',
                target_resolution: {
                  width: 640,
                  height: 480
                }
              },
              screensharing: {
                enabled: true,
                access_request_enabled: false
              }
            }
          }
        });
        console.log('✅ Call created and ready to join');
      }

      const callData = {
        call_id: callId,
        call_type: callType
      };

      return {
        call,
        callData
      };

    } catch (error) {
      console.error('Error joining call:', error);
      throw error;
    }
  };

  const endCall = async (callType, callId) => {
    try {
      // End call via API
      await videoCallAPI.endCall(callType, callId);
      
      console.log('Call ended successfully');

    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  };

  const value = {
    client,
    isLoading,
    error,
    streamConfig,
    createCall,
    joinCall,
    endCall,
    isInitialized: !!client
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Initializing video calling...</span>
      </div>
    );
  }

  if (error) {
    console.warn('🎥 Video calling disabled:', error);
    // Don't block the app, just disable video calling
    const fallbackValue = {
      client: null,
      isLoading: false,
      error,
      streamConfig: null,
      createCall: () => Promise.reject(new Error('Video calling not available')),
      joinCall: () => Promise.reject(new Error('Video calling not available')),
      endCall: () => Promise.reject(new Error('Video calling not available')),
      isInitialized: false
    };

    return (
      <StreamVideoContext.Provider value={fallbackValue}>
        {children}
      </StreamVideoContext.Provider>
    );
  }

  if (!client) {
    // Render children without video functionality
    return (
      <StreamVideoContext.Provider value={value}>
        {children}
      </StreamVideoContext.Provider>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamVideoContext.Provider value={value}>
        {children}
      </StreamVideoContext.Provider>
    </StreamVideo>
  );
};
