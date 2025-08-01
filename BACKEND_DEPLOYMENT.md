# ChatChout Backend Deployment on Vercel

## 🚀 Quick Deployment Steps

### Step 1: Access Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Sign in with your GitHub account
3. Click **"New Project"**

### Step 2: Import Repository
1. Click **"Import Git Repository"**
2. Select: `cheimabarhoumi/chatchout`
3. Click **"Import"**

### Step 3: Configure Project Settings
```
Project Name: chatchout-backend
Framework Preset: Other
Root Directory: server  ⚠️ MUST SELECT THIS!
Build Command: (leave empty)
Output Directory: (leave empty)
Install Command: npm install
```

### Step 4: Environment Variables
Add these in the Environment Variables section:

**NODE_ENV**
```
production
```

**MONGODB_URI**
```
mongodb+srv://admin:admin12345$@cluster0.sbge678.mongodb.net/chatchout?retryWrites=true&w=majority&appName=Cluster0
```

**JWT_SECRET**
```
your_super_secure_jwt_secret_here_at_least_32_characters_long_make_it_random
```

**JWT_EXPIRE**
```
7d
```

**CLIENT_URL** (Update with your frontend URL)
```
https://chatchout.vercel.app
```

**STREAM_API_KEY**
```
twe26yayd39n
```

**STREAM_API_SECRET**
```
wap2h4u6wbskauyx7vhaxkvqe6r6pcpf2kqypdfcyg6ty58hhzd3spb83qkevgpr
```

### Step 5: CORS Configuration
This is critical to fix the current CORS errors!

1. Make sure the vercel.json file has the following configuration:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js",
      "headers": {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "https://chatchout.vercel.app",
        "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
        "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
      }
    }
  ]
}
```

2. Make sure api/index.js has proper CORS handling:
```javascript
// Vercel serverless function entry point
const app = require('../server.js');

// Add CORS headers for Vercel deployment
app.use((req, res, next) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://chatchout.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

module.exports = app;
```

**STREAM_API_KEY**
```
twe26yayd39n
```

**STREAM_API_SECRET**
```
your_stream_secret_from_stream_io_dashboard
```

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait for deployment (usually 1-2 minutes)
3. Note your backend URL: `https://chatchout-backend-xxx.vercel.app`

## 🧪 Testing Your Backend

### Test Health Endpoint
Visit: `https://your-backend-url.vercel.app/api/health`

Expected response:
```json
{
  "status": "OK",
  "message": "ChatChout server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test API Routes
- **Health:** `/api/health`
- **Auth:** `/api/auth/register`, `/api/auth/login`
- **Users:** `/api/users/me`
- **Chats:** `/api/chats`
- **Messages:** `/api/messages`
- **Video Calls:** `/api/video-calls/config`

## 🔧 Post-Deployment Configuration

### Update Frontend Environment
After backend deployment, update your frontend's environment variable:

**VITE_API_URL**
```
https://your-backend-domain.vercel.app/api
```

### Update Backend CORS
Update your backend's CLIENT_URL environment variable:

**CLIENT_URL**
```
https://your-frontend-domain.vercel.app
```

## 🚨 Common Issues & Solutions

### Issue 1: "Function Timeout"
**Solution:** Increase function timeout in vercel.json:
```json
{
  "functions": {
    "api/index.js": {
      "maxDuration": 30
    }
  }
}
```

### Issue 2: "Database Connection Failed"
**Solutions:**
- Check MongoDB URI format
- Verify MongoDB Atlas IP whitelist
- Ensure database user has proper permissions

### Issue 3: "CORS Errors"
**Solutions:**
- Verify CLIENT_URL environment variable
- Check CORS configuration in server.js
- Ensure frontend URL is correct

### Issue 4: "Environment Variables Not Found"
**Solutions:**
- Verify all environment variables are set
- Check variable names (case-sensitive)
- Redeploy after adding variables

## 📊 Monitoring & Logs

### View Function Logs
1. Go to your project in Vercel dashboard
2. Click **"Functions"** tab
3. Click on any function to view logs
4. Monitor errors and performance

### Performance Monitoring
- Check function execution time
- Monitor database connection times
- Watch for timeout errors

## 🔄 Continuous Deployment

### Automatic Deployment
- Push to `main` branch triggers auto-deployment
- Vercel rebuilds and redeploys automatically
- Monitor deployments in dashboard

### Manual Redeploy
1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on latest deployment
3. Wait for completion

## ✅ Success Checklist

- [ ] Backend deployed successfully
- [ ] Health endpoint responds correctly
- [ ] All environment variables set
- [ ] Database connection working
- [ ] CORS configured properly
- [ ] Frontend can connect to backend
- [ ] Authentication endpoints working
- [ ] Real-time features functional

## 🎯 Your Backend URLs

After deployment, you'll have:
- **Main API:** `https://your-backend.vercel.app/api`
- **Health Check:** `https://your-backend.vercel.app/api/health`
- **Auth:** `https://your-backend.vercel.app/api/auth`
- **Socket.IO:** `https://your-backend.vercel.app` (for WebSocket connections)

## 🔐 Security Notes

- Never commit .env files
- Use strong JWT secrets
- Restrict MongoDB IP access
- Monitor API usage
- Rotate secrets regularly

Your ChatChout backend is now live on Vercel! 🎉
