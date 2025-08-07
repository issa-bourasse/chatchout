// Application feature configuration
module.exports = {
  // Feature flags
  features: {
    videoCall: false, // Disable video call feature
    socket: true,     // Enable socket.io for real-time messaging
    friends: true,    // Enable friends feature without requiring sockets
  },
  
  // Version info
  version: '0.1.0',
  
  // Debug settings
  debug: {
    auth: true,      // Enable auth debugging
    socket: false,   // Disable socket debugging
    videoCall: false, // Disable video call debugging
    friends: true    // Enable friends debugging
  }
};
