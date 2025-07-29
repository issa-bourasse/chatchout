# ChatFlow Development Guide

## 🏗️ Project Structure Overview

```
FinalProject/
├── chat-app/          # Frontend React Application
├── server/            # Backend Node.js Application  
├── package.json       # Root package.json for development scripts
├── README.md          # Main project documentation
└── DEVELOPMENT.md     # This development guide
```

## 🚀 Quick Start Commands

### Start Both Servers (Recommended)
```bash
npm run dev
```
This starts both frontend and backend servers concurrently.

### Individual Server Commands
```bash
# Backend only
npm run server

# Frontend only  
npm run client
```

### Installation Commands
```bash
# Install all dependencies
npm run install-all

# Install backend dependencies only
npm run install-server

# Install frontend dependencies only
npm run install-client
```

## 🔧 Development Workflow

### 1. Initial Setup
```bash
# Clone and setup
git clone <repo-url>
cd FinalProject
npm run install-all
```

### 2. Environment Configuration

**Backend (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chatflow
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

**Frontend (`chat-app/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development
```bash
npm run dev
```

This will start:
- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:5173

## 📁 Directory Structure Details

### Frontend (`chat-app/`)
```
chat-app/
├── src/
│   ├── components/        # React components
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── ChatApp.jsx
│   ├── services/          # API and Socket services
│   │   ├── api.js         # Axios API client
│   │   └── socket.js      # Socket.IO client
│   ├── context/           # React contexts
│   │   ├── QueryProvider.jsx
│   │   └── SocketContext.jsx
│   ├── hooks/             # Custom React hooks
│   └── App.jsx            # Main app component
├── public/                # Static assets
├── package.json           # Frontend dependencies
└── vite.config.js         # Vite configuration
```

### Backend (`server/`)
```
server/
├── models/                # MongoDB models
│   ├── User.js           # User model with auth
│   ├── Chat.js           # Chat model (private/group)
│   └── Message.js        # Message model with reactions
├── routes/                # Express routes
│   ├── auth.js           # Authentication routes
│   ├── users.js          # User management routes
│   ├── friends.js        # Friend system routes
│   ├── chats.js          # Chat management routes
│   └── messages.js       # Message handling routes
├── middleware/            # Custom middleware
│   └── auth.js           # JWT authentication middleware
├── socket/                # Socket.IO handlers
│   └── socketHandler.js  # Real-time event handlers
├── utils/                 # Utility functions
├── uploads/               # File upload directory
├── server.js              # Main server file
├── package.json           # Backend dependencies
└── .env                   # Environment variables
```

## 🔄 Development Process

### Making Changes

1. **Frontend Changes:**
   - Edit files in `chat-app/src/`
   - Vite provides hot module replacement
   - Changes reflect immediately in browser

2. **Backend Changes:**
   - Edit files in `server/`
   - Nodemon automatically restarts server
   - API changes available immediately

### Testing Authentication
1. Go to http://localhost:5173
2. Click "Test API Connection" (should show success)
3. Register a new account to test authentication

### Database Management
- MongoDB runs on default port 27017
- Database name: `chatflow`
- Users are created through the registration process

## 🛠️ Common Development Tasks

### Adding New API Endpoints
1. Create route in `server/routes/`
2. Add route to `server/server.js`
3. Add API call to `chat-app/src/services/api.js`
4. Use in React components

### Adding New React Components
1. Create component in `chat-app/src/components/`
2. Add routing if needed in `chat-app/src/App.jsx`
3. Import and use in other components

### Adding Socket.IO Events
1. Add handler in `server/socket/socketHandler.js`
2. Add client handler in `chat-app/src/services/socket.js`
3. Use in React components via SocketContext

## 🐛 Debugging

### Backend Debugging
- Check terminal running `npm run server`
- API requests logged with details
- MongoDB connection status shown
- Error messages displayed in console

### Frontend Debugging
- Open browser DevTools (F12)
- Check Console tab for API requests/responses
- Network tab shows HTTP requests
- React DevTools for component debugging

### Common Issues

1. **CORS Errors:**
   - Check `CLIENT_URL` in `server/.env`
   - Ensure frontend port matches

2. **Database Connection:**
   - Ensure MongoDB is running
   - Check `MONGODB_URI` in `server/.env`

3. **Authentication Issues:**
   - Check JWT_SECRET is set
   - Verify token storage in browser localStorage

## 📦 Building for Production

### Frontend Build
```bash
cd chat-app
npm run build
```
Creates optimized build in `chat-app/dist/`

### Backend Production
```bash
cd server
npm start
```
Runs server without nodemon

## 🔧 Environment Variables

### Required Backend Variables
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `CLIENT_URL` - Frontend URL for CORS

### Required Frontend Variables
- `VITE_API_URL` - Backend API URL

## 📝 Code Style

### Backend
- Use ES6+ features
- Async/await for promises
- Error handling with try/catch
- Mongoose for database operations

### Frontend
- React functional components with hooks
- Tailwind CSS for styling
- React Query for server state
- Socket.IO for real-time features

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Use process manager (PM2)
3. Configure reverse proxy (Nginx)
4. Set up SSL certificates

### Frontend Deployment
1. Build production bundle
2. Serve static files
3. Configure routing for SPA
4. Update API URLs for production

This structure provides a clean separation between frontend and backend, making development, testing, and deployment much easier!
