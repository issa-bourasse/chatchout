# Environment Variables Setup Guide

## 🎯 Overview
This guide will help you set up environment variables for both Railway (backend) and Vercel (frontend) deployments.

## 🚂 Railway Backend Environment Variables

### Step 1: Access Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Sign in and select your project
3. Go to **Variables** tab

### Step 2: Add These Environment Variables

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration (MongoDB Atlas)
MONGODB_URI=mongodb+srv://admin:admin12345$@cluster0.sbge678.mongodb.net/chatchout?retryWrites=true&w=majority&appName=Cluster0

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production_MAKE_THIS_SECURE
JWT_EXPIRE=7d

# CORS Configuration - UPDATE WITH YOUR VERCEL URL
CLIENT_URL=https://your-vercel-app.vercel.app
CORS_ORIGIN=https://your-vercel-app.vercel.app

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Stream.io Video Configuration
STREAM_API_KEY=twe26yayd39n
STREAM_API_SECRET=wap2h4u6wbskauyx7vhaxkvqe6r6pcpf2kqypdfcyg6ty58hhzd3spb83qkevgpr
```

### Step 3: Get Your Railway URL
After deployment, Railway will provide a URL like:
`https://your-app-name.up.railway.app`

## 🌐 Vercel Frontend Environment Variables

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign in and select your project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add These Environment Variables

```env
# Backend API URL - UPDATE WITH YOUR RAILWAY URL
VITE_API_URL=https://your-railway-app.up.railway.app/api

# Socket.IO URL - UPDATE WITH YOUR RAILWAY URL
VITE_SOCKET_URL=https://your-railway-app.up.railway.app

# Stream.io Video Configuration
VITE_STREAM_API_KEY=twe26yayd39n

# App Configuration
VITE_APP_NAME=ChatChout
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_VIDEO_CALLS=true

# Production Settings
VITE_DEBUG=false
VITE_NODE_ENV=production
```

### Step 3: Set Environment for All Environments
Make sure to set these variables for:
- **Production**
- **Preview**
- **Development** (optional)

## 🔄 Update Process

### After Getting Actual URLs:

1. **Get Railway URL** from Railway dashboard
2. **Update Vercel environment variables** with Railway URL
3. **Update Railway environment variables** with Vercel URL
4. **Redeploy both applications**

### Example with Real URLs:

**Railway Variables:**
```env
CLIENT_URL=https://chatchout-frontend.vercel.app
CORS_ORIGIN=https://chatchout-frontend.vercel.app
```

**Vercel Variables:**
```env
VITE_API_URL=https://chatchout-backend.up.railway.app/api
VITE_SOCKET_URL=https://chatchout-backend.up.railway.app
```

## 🔐 Security Notes

1. **Change JWT_SECRET** to a strong, unique value
2. **Keep STREAM_API_SECRET** secure (only on backend)
3. **Use HTTPS URLs** for production
4. **Verify CORS origins** match your frontend URL

## ✅ Verification

After setting up environment variables:

1. **Check Railway logs** for successful startup
2. **Test API endpoint**: `https://your-railway-url/api/health`
3. **Test frontend**: Should load without console errors
4. **Test Socket.IO**: Should connect in browser console

## 🚨 Common Issues

### CORS Errors
- Verify `CLIENT_URL` and `CORS_ORIGIN` match your Vercel URL
- Include both with and without trailing slash

### Socket Connection Fails
- Verify `VITE_SOCKET_URL` points to Railway (not Vercel)
- Check Railway logs for WebSocket errors

### API Calls Fail
- Verify `VITE_API_URL` includes `/api` at the end
- Check Railway URL is correct and accessible
