# ChatChout - MERN Stack Chat Application

A modern, real-time chat application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring friend systems, group chats, and real-time messaging.

## 🌐 Deployment Architecture

```
Frontend (React + Vite) → Vercel (Static Hosting + CDN)
Backend (Node.js + Socket.IO) → Railway (WebSocket Support)
Database → MongoDB Atlas (Cloud Database)
```

**Why this architecture?**
- ✅ **Vercel**: Perfect for React apps, global CDN, automatic HTTPS, free tier
- ✅ **Railway**: Supports WebSockets for real-time features, easy deployment, free tier
- ✅ **MongoDB Atlas**: Managed database, reliable and scalable, free tier

**Socket.IO Support**: Unlike Vercel's serverless functions, Railway provides persistent connections needed for WebSocket/Socket.IO real-time features.

## 🏗️ Project Structure

```
FinalProject/
├── chat-app/                 # React Frontend Application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API and Socket.IO services
│   │   ├── context/          # React contexts
│   │   ├── hooks/            # Custom React hooks
│   │   └── ...
│   ├── public/               # Static assets
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite configuration
│
├── server/                   # Node.js Backend Application
│   ├── models/               # MongoDB models
│   ├── routes/               # Express.js routes
│   ├── middleware/           # Custom middleware
│   ├── socket/               # Socket.IO handlers
│   ├── utils/                # Utility functions
│   ├── uploads/              # File uploads directory
│   ├── package.json          # Backend dependencies
│   ├── server.js             # Main server file
│   └── .env                  # Environment variables
│
└── README.md                 # This file
```

## 🚀 Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes
- Auto-login on page refresh

### 👥 Friend System
- Send/receive friend requests
- Accept/reject friend requests
- Friend list management
- User search functionality
- Online status tracking

### 💬 Real-time Chat
- Private messaging between friends
- Group chat creation and management
- Real-time message delivery with Socket.IO
- Message reactions and replies
- Read receipts and typing indicators
- Message editing and deletion

### 🏢 Group Management
- Create group chats with multiple users
- Invite friends to groups
- Group permissions (owner, admin, member)
- Remove participants from groups
- Group settings management

### 🎨 Modern UI/UX
- Responsive design for all devices
- Beautiful animations and transitions
- Tailwind CSS 4.0 with new plugin system
- Real-time status updates
- Professional chat interface

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 4.0** - Latest version with new Vite plugin
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (local installation or Atlas account) - See Database Setup section below
- **npm** (comes with Node.js)

### Quick Start

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start both servers:**
   ```bash
   npm run dev
   ```

3. **Open the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

### Manual Installation

1. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd chat-app
   npm install
   ```

3. **Environment files are already configured** for local development:
   - `server/.env` - Backend configuration
   - `chat-app/.env` - Frontend configuration

### Running the Application

#### Option 1: Start Both Servers Together (Recommended)
```bash
npm run dev
```
This starts both backend and frontend servers simultaneously.

#### Option 2: Start Servers Separately

1. **Backend server:**
   ```bash
   cd server
   npm run dev
   ```
   Server runs on http://localhost:5000

2. **Frontend application:**
   ```bash
   cd chat-app
   npm run dev
   ```
   Frontend runs on http://localhost:5173

#### Access the Application
Open your browser and navigate to **http://localhost:5173**

## 🧪 Testing the Application

### Test Flow
1. **Registration:** Create a new account with strong password
2. **Login:** Use your new account credentials
3. **Friends:** Search for users and send friend requests
4. **Chat:** Create private chats with friends
5. **Groups:** Create group chats and invite multiple friends
6. **Real-time:** Test real-time messaging, typing indicators, and online status

## 📁 Key Files

### Backend
- `server/server.js` - Main server configuration
- `server/models/User.js` - User model with authentication
- `server/models/Chat.js` - Chat model for private/group chats
- `server/models/Message.js` - Message model with reactions
- `server/routes/auth.js` - Authentication routes
- `server/routes/friends.js` - Friend management routes
- `server/routes/chats.js` - Chat management routes
- `server/socket/socketHandler.js` - Real-time Socket.IO events

### Frontend
- `chat-app/src/App.jsx` - Main app with routing and auth context
- `chat-app/src/services/api.js` - API service with axios
- `chat-app/src/services/socket.js` - Socket.IO service
- `chat-app/src/components/ChatApp.jsx` - Main chat interface
- `chat-app/src/components/Login.jsx` - Login form
- `chat-app/src/components/Signup.jsx` - Registration form

## 🔧 Development

### Backend Development
```bash
cd server
npm run dev  # Starts with nodemon for auto-restart
```

### Frontend Development
```bash
cd chat-app
npm run dev  # Starts Vite dev server with HMR
```

### Building for Production
```bash
# Backend
cd server
npm start

# Frontend
cd chat-app
npm run build
```

## 🗄️ Database Configuration

### Current Setup: MongoDB Atlas (Cloud Database)

The application is **pre-configured** to use a MongoDB Atlas cloud database, so **no additional database setup is required**!

- ✅ **Database**: MongoDB Atlas (cloud)
- ✅ **Connection**: Already configured in `server/.env`
- ✅ **Ready to use**: Just start the servers and begin chatting

### Alternative: Local MongoDB (Optional)

If you prefer to use a local MongoDB instance:

1. **Install MongoDB Community Edition** from [mongodb.com](https://www.mongodb.com/try/download/community)
2. **Start MongoDB service**
3. **Update `server/.env`**:
   ```env
   # Comment out Atlas URI:
   # MONGODB_URI=mongodb+srv://admin:admin12345$@cluster0.sbge678.mongodb.net/chatchout?retryWrites=true&w=majority&appName=Cluster0

   # Uncomment local URI:
   MONGODB_URI=mongodb://localhost:27017/chatchout
   ```

## 🌟 Features in Detail

### Real-time Features
- ⚡ Instant message delivery
- 👀 Typing indicators
- ✅ Read receipts
- 🟢 Online/offline status
- 🔔 Friend request notifications
- 📱 Group invitations

### Security Features
- 🔒 JWT authentication
- 🛡️ Password hashing
- 🚫 Rate limiting
- 🔐 CORS protection
- 🛡️ Input validation
- 🔒 Protected routes

## 🚀 Production Deployment

### Quick Deployment Guide

1. **Deploy Backend to Railway**:
   ```bash
   # See RAILWAY_DEPLOYMENT.md for detailed steps
   ```

2. **Deploy Frontend to Vercel**:
   ```bash
   # See VERCEL_DEPLOYMENT.md for detailed steps
   ```

3. **Test Deployment**:
   ```bash
   node test-deployment.js <railway-url> <vercel-url>
   ```

### Deployment Files

- 📋 **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete deployment overview
- 🚂 **[RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)** - Railway backend deployment
- 🌐 **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)** - Vercel frontend deployment
- 🔧 **[ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)** - Environment variables guide
- 🧪 **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing deployed application
- 🛠️ **[deploy.sh](deploy.sh)** - Automated deployment script

### Environment Variables

**Railway (Backend)**:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
CLIENT_URL=https://your-vercel-app.vercel.app
```

**Vercel (Frontend)**:
```env
VITE_API_URL=https://your-railway-app.up.railway.app/api
VITE_SOCKET_URL=https://your-railway-app.up.railway.app
```

### Deployment Architecture Benefits

- 🌍 **Global CDN**: Vercel provides worldwide content delivery
- ⚡ **Real-time Support**: Railway enables WebSocket connections
- 💰 **Cost Effective**: Both platforms offer generous free tiers
- 🔄 **Auto Deployment**: Git-based automatic deployments
- 📊 **Monitoring**: Built-in analytics and logging
- 🔒 **Security**: Automatic HTTPS and security headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with React and Node.js
- Styled with Tailwind CSS 4.0
- Icons by Lucide React
- Real-time features powered by Socket.IO
