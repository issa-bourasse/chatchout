import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, Video, User } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const VideoCallInvitation = ({ invitation, onAccept, onDecline, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds to respond
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onDecline(); // Auto-decline when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDecline]);

  const handleAccept = () => {
    onAccept();
    // Navigate to video call
    navigate(`/video-call/${invitation.callType}/${invitation.callId}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 animate-bounce-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Incoming Video Call
          </h2>
          <p className="text-gray-600">
            {invitation.invitedBy.name} is calling you
          </p>
        </div>

        {/* Caller Info */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-3">
            <img
              src={invitation.invitedBy.avatar}
              alt={invitation.invitedBy.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="font-semibold text-gray-900">
                {invitation.invitedBy.name}
              </p>
              <p className="text-sm text-gray-500">
                {invitation.chatName}
              </p>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">
              {timeLeft}s remaining
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onDecline}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
            <span>Decline</span>
          </button>
          
          <button
            onClick={handleAccept}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span>Accept</span>
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const VideoCallNotification = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg border p-4 max-w-sm z-50 animate-slide-in">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Video className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {notification.type === 'call_ended' && 'Call Ended'}
            {notification.type === 'call_accepted' && 'Call Accepted'}
            {notification.type === 'call_declined' && 'Call Declined'}
          </p>
          <p className="text-xs text-gray-500">
            {notification.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export { VideoCallInvitation, VideoCallNotification };
