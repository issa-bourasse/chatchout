# Railway Backend Deployment Guide

## 🚂 Step-by-Step Railway Deployment

### Prerequisites
- GitHub account with your code pushed
- Railway account (free tier available)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign up with GitHub
4. Authorize Railway to access your repositories

### Step 2: Deploy from GitHub
1. Click **"Deploy from GitHub repo"**
2. Select your **chatchout** repository
3. Choose **"Deploy from the repo root"** (Railway will detect the server folder)
4. Click **"Deploy Now"**

### Step 3: Configure Build Settings
Railway should auto-detect Node.js, but if needed:
1. Go to **Settings** → **Build**
2. Set **Build Command**: `cd server && npm install`
3. Set **Start Command**: `cd server && npm start`
4. Set **Root Directory**: `/` (leave empty for repo root)

### Step 4: Set Environment Variables
Go to **Variables** tab and add these one by one:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://admin:admin12345$@cluster0.sbge678.mongodb.net/chatchout?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production_MAKE_THIS_SECURE
JWT_EXPIRE=7d
CLIENT_URL=https://your-vercel-app.vercel.app
CORS_ORIGIN=https://your-vercel-app.vercel.app
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
STREAM_API_KEY=twe26yayd39n
STREAM_API_SECRET=wap2h4u6wbskauyx7vhaxkvqe6r6pcpf2kqypdfcyg6ty58hhzd3spb83qkevgpr
```

**⚠️ Important**: You'll update `CLIENT_URL` and `CORS_ORIGIN` after deploying frontend!

### Step 5: Get Your Railway URL
1. After deployment, go to **Settings** → **Domains**
2. Your URL will be something like: `https://chatchout-production-xxxx.up.railway.app`
3. **Copy this URL** - you'll need it for frontend deployment!

### Step 6: Test Backend Deployment
1. Visit: `https://your-railway-url.up.railway.app/api/health`
2. Should return: `{"status":"OK","message":"ChatChout server is running"}`
3. Check **Logs** tab for any errors

### Step 7: Enable Custom Domain (Optional)
1. Go to **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Add your domain (e.g., `api.chatchout.com`)
4. Update DNS records as instructed

## 🔧 Troubleshooting

### Build Fails
- Check **Logs** for specific error messages
- Ensure `package.json` is in the server folder
- Verify all dependencies are listed in `package.json`

### Server Won't Start
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check **Logs** for startup errors

### CORS Errors
- Ensure `CLIENT_URL` matches your Vercel URL exactly
- Include both with and without trailing slash if needed
- Check browser console for specific CORS error messages

### Socket.IO Issues
- Railway supports WebSockets natively
- Check that Socket.IO is properly configured in server.js
- Verify client is connecting to correct Railway URL

## 📊 Railway Features

### Automatic Deployments
- Railway automatically redeploys when you push to GitHub
- Check **Deployments** tab for deployment history

### Monitoring
- **Metrics** tab shows CPU, memory, and network usage
- **Logs** tab shows real-time application logs

### Scaling
- Free tier: 512MB RAM, shared CPU
- Paid tiers: More resources and custom domains

## 🎯 Next Steps

After successful Railway deployment:
1. **Copy your Railway URL**
2. **Deploy frontend to Vercel** (next step)
3. **Update environment variables** with actual URLs
4. **Test full application** functionality

## 💡 Pro Tips

1. **Use Railway CLI** for faster deployments:
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   railway up
   ```

2. **Monitor logs** during first deployment:
   ```bash
   railway logs
   ```

3. **Set up alerts** for downtime in Railway dashboard

4. **Use Railway's built-in database** if you prefer over MongoDB Atlas
