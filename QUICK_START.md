# ChatChout - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Application
```bash
npm run dev
```

### 2. Open the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

### 3. Create an Account
1. Go to http://localhost:5173
2. Click "Sign Up"
3. Fill in your details:
   - **Name**: Your full name
   - **Email**: Valid email address
   - **Password**: Must contain uppercase, lowercase, and number (e.g., "Password123")

### 4. Login
1. Use your email and password to log in
2. You'll be redirected to the chat interface

### 5. Test the Features

#### Add Friends
1. Click the "Add Friends" button (+ icon)
2. Search for users by name or email
3. Send friend requests
4. Accept incoming friend requests

#### Start Chatting
1. Click on a friend in your friends list
2. Type a message and press Enter
3. Messages should appear in real-time

#### Create Group Chats
1. Click "Create Group" 
2. Add multiple friends
3. Give your group a name
4. Start group conversations

## 🔧 Troubleshooting

### "Too Many Requests" Error (429)
This means you've hit the rate limit. **Fixed in development mode!**
- Rate limiting is now disabled during development
- You can register/login as many times as needed for testing

### "Failed to send message" Error
This usually means:
1. **Not logged in**: Log out and log back in
2. **Invalid chat**: Make sure you're in a valid chat
3. **Network issue**: Check your internet connection

### Authentication Issues
1. Clear browser localStorage: 
   - Open Developer Tools (F12)
   - Go to Application > Local Storage
   - Clear all data
   - Refresh and log in again

### Server Not Responding
1. Check if backend is running on port 5000
2. Check if frontend is running on port 5173
3. Restart both servers: `npm run dev`

## 📱 Features Available

- ✅ **User Registration/Login**
- ✅ **Real-time Messaging** 
- ✅ **Friend System**
- ✅ **Group Chats**
- ✅ **Typing Indicators**
- ✅ **Online Status**
- ✅ **Message Reactions**
- ✅ **Video Calls** (Stream.io)
- ✅ **File Uploads**
- ✅ **Message Editing/Deletion**

## 🎯 Test Accounts

Create multiple accounts to test the chat features:

**Account 1:**
- Name: Alice Johnson
- Email: alice@test.com
- Password: Password123

**Account 2:**
- Name: Bob Smith
- Email: bob@test.com
- Password: Password123

**Account 3:**
- Name: Carol Davis
- Email: carol@test.com
- Password: Password123

## 🔍 Debug Information

### Check Authentication Status
Open browser console (F12) and look for:
- "User authenticated: [user object]"
- "Token in localStorage: Present/Missing"

### API Requests
All API requests are logged in the console:
- "API Request: POST /messages"
- "API Response: 200 /messages"

### Common Error Messages
- **401 Unauthorized**: Not logged in
- **400 Bad Request**: Invalid data sent
- **404 Not Found**: Chat or user not found
- **500 Server Error**: Backend issue

## 💡 Tips

1. **Open multiple browser tabs** to test real-time messaging
2. **Use different browsers** to simulate multiple users
3. **Check the console** for detailed error messages
4. **Clear localStorage** if you encounter auth issues
5. **Restart servers** if something seems broken

## 🆘 Need Help?

If you're still having issues:
1. Check the console for error messages
2. Verify both servers are running
3. Try logging out and back in
4. Clear browser data and try again
