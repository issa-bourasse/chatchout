// Application feature configuration
module.exports = {
  // Feature flags
  features: {
    videoCall: false, // Disable video call feature
    socket: false,    // Disable socket.io for now until we fix connection issues
  },
  
  // Version info
  version: '0.1.0',
  
  // Debug settings
  debug: {
    auth: true,      // Enable auth debugging
    socket: false,   // Disable socket debugging
    videoCall: false // Disable video call debugging
  }
};
