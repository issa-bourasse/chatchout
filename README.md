# ChatChout - MERN Stack Chat Application

A modern, real-time chat application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring friend systems, group chats, and real-time messaging.

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
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd FinalProject
   ```

2. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../chat-app
   npm install
   ```

4. **Configure environment variables:**
   
   Create `server/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/chatchout
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:5173
   ```

   Create `chat-app/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on http://localhost:5000

2. **Start the frontend application:**
   ```bash
   cd chat-app
   npm run dev
   ```
   Frontend will run on http://localhost:5173

3. **Access the application:**
   Open your browser and navigate to http://localhost:5173

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
