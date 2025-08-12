# ChatChout Deployment Guide
## Frontend (Vercel) + Backend (Railway)

## 🎯 **Deployment Architecture**
```
Frontend (React) → Vercel
Backend (Node.js + Socket.IO) → Railway  
Database → MongoDB Atlas
```

## 🚀 **Step 1: Deploy Backend to Railway**

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your GitHub account

### 1.2 Deploy Backend
1. **Create New Project** in Railway
2. **Deploy from GitHub repo**
3. **Select your repository**
4. **Choose the `server` folder** (or root if server is in root)
5. Railway will auto-detect Node.js and deploy

### 1.3 Set Environment Variables in Railway
Go to your Railway project → Variables tab and add:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://admin:admin12345$@cluster0.sbge678.mongodb.net/chatchout?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production_MAKE_THIS_SECURE
JWT_EXPIRE=7d
CLIENT_URL=https://your-vercel-app.vercel.app
STREAM_API_KEY=twe26yayd39n
STREAM_API_SECRET=wap2h4u6wbskauyx7vhaxkvqe6r6pcpf2kqypdfcyg6ty58hhzd3spb83qkevgpr
MAX_FILE_SIZE=10485760
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

**⚠️ IMPORTANT**: Replace `https://your-vercel-app.vercel.app` with your actual Vercel URL!

### 1.4 Get Railway URL
After deployment, Railway will give you a URL like:
`https://your-app-name.up.railway.app`

**⚠️ IMPORTANT**: Railway URLs now use `.up.railway.app` domain!

## 🌐 **Step 2: Update Frontend Environment**

### 2.1 Update Vercel Environment Variables
In your Vercel dashboard → Project → Settings → Environment Variables:

```env
VITE_API_URL=https://your-railway-app.up.railway.app/api
VITE_SOCKET_URL=https://your-railway-app.up.railway.app
VITE_STREAM_API_KEY=twe26yayd39n
VITE_APP_NAME=ChatChout
VITE_APP_VERSION=1.0.0
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_VIDEO_CALLS=true
VITE_DEBUG=false
VITE_NODE_ENV=production
```

**⚠️ IMPORTANT**: Replace `https://your-railway-app.up.railway.app` with your actual Railway URL!

### 2.2 Redeploy Frontend
After updating environment variables, redeploy your Vercel app to apply changes.

## ✅ **Step 3: Verify Deployment**

### 3.1 Test Backend
Visit: `https://your-railway-app.up.railway.app/api/health`
Should return: `{"status":"OK","message":"ChatChout server is running"}`

### 3.2 Test Frontend
Visit: `https://your-vercel-app.vercel.app`
Should load the ChatChout application

### 3.3 Test Full Functionality
1. **Register/Login** - Should work
2. **Send Messages** - Should work (API mode)
3. **Real-time Features** - Should work (Socket.IO)
4. **Check Console** - Should show Socket.IO connection

## 🔧 **Troubleshooting**

### Backend Issues
- **Check Railway logs** for errors
- **Verify environment variables** are set correctly
- **Check MongoDB connection** in logs

### Frontend Issues
- **Check browser console** for API errors
- **Verify environment variables** in Vercel
- **Check network tab** for failed requests

### CORS Issues
If you get CORS errors:
1. **Update CLIENT_URL** in Railway environment
2. **Update CORS_ORIGIN** in Railway environment
3. **Redeploy backend**

## 📱 **Expected Results**

After successful deployment:
- ✅ **Frontend**: Fast loading on Vercel CDN
- ✅ **Backend**: Full Node.js with Socket.IO on Railway
- ✅ **Real-time**: Socket.IO working properly
- ✅ **Database**: MongoDB Atlas connected
- ✅ **All Features**: Working including real-time messaging

## 💰 **Costs**
- **Vercel**: Free (frontend)
- **Railway**: Free tier (backend)
- **MongoDB Atlas**: Free tier (database)
- **Total**: $0/month for small apps

## 🎯 **URLs Summary**
```
Frontend: https://your-vercel-app.vercel.app
Backend:  https://your-railway-app.up.railway.app
API:      https://your-railway-app.up.railway.app/api
Health:   https://your-railway-app.up.railway.app/api/health
Socket:   wss://your-railway-app.up.railway.app (WebSocket support!)
```
