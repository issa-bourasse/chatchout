import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CallControls,
  CallingState,
  SpeakerLayout,
  useCallStateHooks,
  StreamCall,
} from '@stream-io/video-react-sdk';
import { useStreamVideo } from '../context/StreamVideoContext';
import { useSocket } from '../context/SocketContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Settings } from 'lucide-react';

const VideoCall = () => {
  const { callType, callId } = useParams();
  const navigate = useNavigate();
  const { joinCall, endCall, isInitialized } = useStreamVideo();
  const { socket } = useSocket();
  
  const [call, setCall] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeCall = async () => {
      // Check if video calls are enabled from server config
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_BASE_URL}/video-calls/config`);
        const data = await response.json();

        if (!data.success) {
          setError('Video calling is currently disabled');
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error('Failed to check video call availability:', err);
        // Continue anyway - video calls might still work
      }
      
      if (!isInitialized) {
        setError('Video calling not available');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Join the call
        const { call: streamCall } = await joinCall(callType, callId);
        
        // Join the call
        await streamCall.join({ create: false });
        
        setCall(streamCall);
        console.log('✅ Joined video call:', callId);

      } catch (error) {
        console.error('❌ Failed to join call:', error);
        setError(error.message || 'Failed to join video call');
      } finally {
        setIsLoading(false);
      }
    };

    initializeCall();

    // Cleanup function
    return () => {
      if (call) {
        call.leave();
      }
    };
  }, [callType, callId, joinCall, isInitialized]);

  const handleEndCall = async () => {
    try {
      if (call) {
        await call.leave();
        
        // Notify backend that call ended
        if (socket) {
          socket.emit('video_call_ended', {
            callId,
            chatId: call.state.custom?.chatId
          });
        }
        
        // End call via API
        await endCall(callType, callId);
      }
      
      // Navigate back to chat
      navigate('/chat');
      
    } catch (error) {
      console.error('Error ending call:', error);
      // Navigate back anyway
      navigate('/chat');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Joining video call...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center text-white">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Unable to join call</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/chat')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center text-white">
          <p>Call not found</p>
          <button
            onClick={() => navigate('/chat')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      <StreamCall call={call}>
        <VideoCallUI onEndCall={handleEndCall} />
      </StreamCall>
    </div>
  );
};

const VideoCallUI = ({ onEndCall }) => {
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">📹</div>
          <p className="text-xl">
            {callingState === CallingState.JOINING && 'Joining call...'}
            {callingState === CallingState.RECONNECTING && 'Reconnecting...'}
            {callingState === CallingState.OFFLINE && 'You are offline'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <button
          onClick={onEndCall}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PhoneOff className="w-4 h-4" />
          <span>End Call</span>
        </button>
      </div>

      {/* Video Layout */}
      <div className="flex-1 relative">
        <SpeakerLayout />
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <CallControls />
      </div>
    </div>
  );
};

export default VideoCall;
