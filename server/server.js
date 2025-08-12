console.log('🚀 Starting ChatChout server...');

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('📦 Dependencies loaded successfully');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');
const messageRoutes = require('./routes/messages');
const friendRoutes = require('./routes/friends');
const videoCallRoutes = require('./routes/videoCalls');

const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Production allowed origins
      const allowedOrigins = [
        process.env.CLIENT_URL,
        process.env.CORS_ORIGIN,
        'https://chatchout.vercel.app',
        'https://chatchout-three.vercel.app'
      ].filter(Boolean);

      // Also allow any vercel.app subdomain for this project
      const isVercelApp = origin.includes('chatchout') && origin.includes('vercel.app');

      if (allowedOrigins.includes(origin) || isVercelApp) {
        callback(null, true);
      } else {
        console.log(`❌ Socket.IO CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Security middleware
app.use(helmet());

// Rate limiting (disabled in development)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/api/', limiter);
}

// CORS configuration with dynamic origin checking
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Production allowed origins
    const allowedOrigins = [
      process.env.CLIENT_URL,
      process.env.CORS_ORIGIN,
      'https://chatchout.vercel.app',
      'https://chatchout-three.vercel.app'
    ].filter(Boolean);

    // Also allow any vercel.app subdomain for this project
    const isVercelApp = origin.includes('chatchout') && origin.includes('vercel.app');

    if (allowedOrigins.includes(origin) || isVercelApp) {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

console.log('🔒 CORS configuration:', corsOptions);
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
console.log('🔄 Attempting to connect to MongoDB...');
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatchout';
console.log(`📍 MongoDB URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10000, // 10 second timeout
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('⚠️  Server will continue without database connection');
  console.log('💡 To use local MongoDB: Install MongoDB locally or use MongoDB Atlas');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/video-calls', videoCallRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'ChatChout server is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO connection handling
console.log('🔌 Setting up Socket.IO handlers...');
socketHandler(io);

// Add debugging for Socket.IO connections
io.engine.on("connection_error", (err) => {
  console.log('❌ Socket.IO connection error:', err.req);
  console.log('❌ Error code:', err.code);
  console.log('❌ Error message:', err.message);
  console.log('❌ Error context:', err.context);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
  console.log(`🔌 Socket.IO: Enabled`);
  console.log('✅ ChatChout server is ready!');
});
