# ChatChout - Vercel Deployment Guide

This guide will help you deploy both the frontend and backend of ChatChout to Vercel.

## 🚀 Prerequisites

- Vercel account (https://vercel.com)
- GitHub repository with your code
- MongoDB Atlas database
- Stream.io account with API credentials

## 📁 Project Structure for Deployment

```
chatchout/
├── chat-app/              # Frontend (React + Vite)
│   ├── vercel.json       # Frontend Vercel config
│   ├── .env.production   # Production environment variables
│   └── package.json      # Frontend dependencies
├── server/               # Backend (Node.js + Express)
│   ├── vercel.json      # Backend Vercel config
│   ├── api/index.js     # Vercel serverless entry point
│   └── server.js        # Main server file
└── DEPLOYMENT.md        # This file
```

## 🔧 Step 1: Backend Deployment

### 1.1 Deploy Backend to Vercel

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "New Project"

2. **Import Repository**
   - Select your GitHub repository
   - Choose "server" folder as root directory
   - Framework Preset: "Other"

3. **Configure Environment Variables**
   In Vercel dashboard, go to Project Settings → Environment Variables and add:

   **Key:** `NODE_ENV` **Value:** `production`
   **Key:** `MONGODB_URI` **Value:** `mongodb+srv://admin:admin12345$@cluster0.sbge678.mongodb.net/chatchout?retryWrites=true&w=majority&appName=Cluster0`
   **Key:** `JWT_SECRET` **Value:** `your_super_secure_jwt_secret_here_at_least_32_characters_long`
   **Key:** `JWT_EXPIRE` **Value:** `7d`
   **Key:** `CLIENT_URL` **Value:** `https://your-frontend-domain.vercel.app`
   **Key:** `STREAM_API_KEY` **Value:** `twe26yayd39n`
   **Key:** `STREAM_API_SECRET` **Value:** `your_stream_secret_here`

   ⚠️ **Important:** Add each variable individually in the Vercel dashboard, don't use @ references.

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://chatchout-backend.vercel.app`)

### 1.2 Update CORS Settings

After backend deployment, update the CORS configuration in `server/server.js` if needed.

## 🎨 Step 2: Frontend Deployment

### 2.1 Update Frontend Environment

1. **Update `.env.production`**
   ```env
   VITE_API_URL=https://your-backend-deployment.vercel.app/api
   VITE_APP_NAME=ChatChout
   VITE_APP_VERSION=1.0.0
   ```

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "Update production API URL"
   git push origin main
   ```

### 2.2 Deploy Frontend to Vercel

1. **Create New Project**
   - Go to Vercel Dashboard
   - Click "New Project"
   - Import your repository: `cheimabarhoumi/chatchout`
   - **IMPORTANT:** Set Root Directory to `chat-app`
   - Framework Preset: "Vite"

2. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables**
   In Project Settings → Environment Variables, add:
   **Key:** `VITE_API_URL` **Value:** `https://your-backend-deployment.vercel.app/api`

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

**⚠️ Critical:** Make sure to set the Root Directory to `chat-app` when importing the project, otherwise the build will fail.

## 🔄 Step 3: Update Cross-References

### 3.1 Update Backend CORS

Update your backend's `CLIENT_URL` environment variable with your frontend URL:
```env
CLIENT_URL=https://your-frontend-domain.vercel.app
```

### 3.2 Update Frontend API URL

Ensure your frontend's `VITE_API_URL` points to your backend:
```env
VITE_API_URL=https://your-backend-domain.vercel.app/api
```

## 🧪 Step 4: Testing Deployment

### 4.1 Test Backend

Visit your backend health check:
```
https://your-backend-domain.vercel.app/api/health
```

Should return:
```json
{
  "status": "OK",
  "message": "ChatChout server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4.2 Test Frontend

1. Visit your frontend URL
2. Try to register/login
3. Test chat functionality
4. Test video calling

## 🔒 Step 5: Security Configuration

### 5.1 Environment Variables Security

- Never commit `.env` files to Git
- Use Vercel's environment variable dashboard
- Rotate secrets regularly

### 5.2 Database Security

1. **MongoDB Atlas**
   - Restrict IP access to your Vercel deployment
   - Use strong passwords
   - Enable database monitoring

2. **Stream.io**
   - Restrict API key usage
   - Monitor usage and billing

## 📊 Step 6: Domain Configuration (Optional)

### 6.1 Custom Domain for Frontend

1. Go to your frontend project in Vercel
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### 6.2 Custom Domain for Backend

1. Go to your backend project in Vercel
2. Add custom domain for API
3. Update frontend `VITE_API_URL` accordingly

## 🚨 Troubleshooting

### Common Issues

1. **MIME Type Error (Frontend)**
   - Error: "Expected a JavaScript module script but server responded with MIME type text/html"
   - **Solution:** Ensure Root Directory is set to `chat-app` in Vercel
   - **Solution:** Try redeploying with simplified vercel.json
   - **Solution:** Check that build output is in `dist` folder

2. **CORS Errors**
   - Check `CLIENT_URL` in backend environment
   - Verify CORS configuration in `server.js`

3. **Database Connection**
   - Verify MongoDB URI format
   - Check IP whitelist in MongoDB Atlas

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in `package.json`
   - Ensure Vite build completes successfully

5. **Socket.IO Issues**
   - Vercel has limitations with WebSockets
   - Consider using polling fallback

### Logs and Debugging

- Check Vercel function logs in dashboard
- Use `console.log` for debugging
- Monitor performance and errors

## 🎉 Success!

Your ChatChout application should now be fully deployed on Vercel!

**Frontend URL:** `https://your-frontend-domain.vercel.app`
**Backend URL:** `https://your-backend-domain.vercel.app`

## 📝 Post-Deployment Checklist

- [ ] Backend health check responds correctly
- [ ] Frontend loads without errors
- [ ] User registration/login works
- [ ] Real-time chat messaging works
- [ ] Video calling functionality works
- [ ] Database operations are successful
- [ ] All environment variables are set
- [ ] CORS is properly configured
- [ ] Custom domains configured (if applicable)

## 🔄 Continuous Deployment

Both projects are now set up for automatic deployment:
- Push to `main` branch triggers automatic deployment
- Vercel will rebuild and redeploy automatically
- Monitor deployments in Vercel dashboard
