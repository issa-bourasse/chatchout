# ChatChout - Local Development Guide

## 🚀 Quick Start

1. **Install dependencies and start servers:**
   ```bash
   npm run dev
   ```

2. **Open the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

## 🗄️ Database Options

### Option 1: Local MongoDB (Recommended)
```bash
# Install MongoDB Community Edition
# Windows: Download from mongodb.com
# macOS: brew install mongodb-community
# Linux: Follow official MongoDB installation guide

# Start MongoDB
mongod

# Verify connection
mongosh --eval "db.runCommand('ping')"
```

### Option 2: Use MongoDB Atlas (Cloud)
1. Create account at mongodb.com/atlas
2. Create a free cluster
3. Get connection string
4. Update `server/.env`:
   ```env
   # Comment out local URI:
   # MONGODB_URI=mongodb://localhost:27017/chatchout
   
   # Uncomment and update Atlas URI:
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatchout
   ```

## 🔧 Configuration Files

### Backend (`server/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chatchout
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### Frontend (`chat-app/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_STREAM_API_KEY=twe26yayd39n
VITE_APP_NAME=ChatChout
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_VIDEO_CALLS=true
```

## 🧪 Testing the Application

1. **Register a new account**
2. **Login with your credentials**
3. **Search for users** (create multiple accounts to test)
4. **Send friend requests**
5. **Start chatting** in real-time
6. **Test group chats**
7. **Try video calls** (if enabled)

## 🛠️ Development Commands

```bash
# Install all dependencies
npm run install-all

# Start both servers
npm run dev

# Start backend only
npm run server

# Start frontend only
npm run client

# Build for production
npm run build
```

## 🔍 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally
- Check connection string in `server/.env`
- Verify firewall settings

### Port Already in Use
- Kill processes on ports 5000 or 5173
- Change ports in environment files if needed

### Socket.IO Not Working
- Ensure both servers are running
- Check browser console for connection errors
- Verify CORS settings

## 📁 Project Structure

```
chatchout/
├── server/                 # Backend (Node.js + Express)
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── socket/            # Socket.IO handlers
│   ├── middleware/        # Custom middleware
│   └── server.js          # Main server file
├── chat-app/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API and Socket services
│   │   └── context/       # React contexts
│   └── public/            # Static assets
└── package.json           # Root package with scripts
```

## ✨ Features Available

- ✅ User Authentication (JWT)
- ✅ Real-time Messaging (Socket.IO)
- ✅ Friend System
- ✅ Group Chats
- ✅ Typing Indicators
- ✅ Online Status
- ✅ Message Reactions
- ✅ Video Calls (Stream.io)
- ✅ File Uploads
- ✅ Responsive Design

## 🎯 Next Steps

1. **Customize the UI** - Modify Tailwind CSS classes
2. **Add new features** - Extend the API and components
3. **Deploy** - Use platforms like Railway, Render, or DigitalOcean
4. **Scale** - Add Redis for session management, implement clustering
