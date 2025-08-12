# Vercel Frontend Deployment Guide

## 🌐 Step-by-Step Vercel Deployment

### Prerequisites
- GitHub account with your code pushed
- Vercel account (free tier available)
- Railway backend URL from previous step

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with GitHub
4. Authorize Vercel to access your repositories

### Step 2: Import Project
1. Click **"New Project"**
2. Select your **chatchout** repository
3. **Important**: Set **Root Directory** to `chat-app`
4. Click **"Deploy"**

### Step 3: Configure Build Settings
Vercel should auto-detect Vite, but verify:
- **Framework Preset**: Vite
- **Root Directory**: `chat-app`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 4: Set Environment Variables
Go to **Settings** → **Environment Variables** and add these:

**For Production, Preview, and Development:**

```env
VITE_API_URL=https://your-railway-url.up.railway.app/api
VITE_SOCKET_URL=https://your-railway-url.up.railway.app
VITE_STREAM_API_KEY=twe26yayd39n
VITE_APP_NAME=ChatChout
VITE_APP_VERSION=1.0.0
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_VIDEO_CALLS=true
VITE_DEBUG=false
VITE_NODE_ENV=production
```

**⚠️ Replace `your-railway-url` with your actual Railway URL!**

### Step 5: Redeploy with Environment Variables
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Check **"Use existing Build Cache"**
4. Click **"Redeploy"**

### Step 6: Get Your Vercel URL
1. After deployment, you'll get a URL like: `https://chatchout-frontend.vercel.app`
2. **Copy this URL** - you need to update Railway environment variables!

### Step 7: Update Railway Environment Variables
Go back to Railway and update these variables:
```env
CLIENT_URL=https://your-vercel-url.vercel.app
CORS_ORIGIN=https://your-vercel-url.vercel.app
```

### Step 8: Test Frontend Deployment
1. Visit your Vercel URL
2. Check browser console for errors
3. Try to register/login
4. Test real-time messaging

## 🔧 Advanced Configuration

### Custom Domain
1. Go to **Settings** → **Domains**
2. Add your custom domain (e.g., `chatchout.com`)
3. Update DNS records as instructed
4. Update Railway `CLIENT_URL` with new domain

### Performance Optimization
Vercel automatically provides:
- Global CDN
- Automatic HTTPS
- Image optimization
- Edge functions

### Preview Deployments
- Every pull request gets a preview URL
- Test changes before merging
- Share preview links with team

## 🚨 Troubleshooting

### Build Fails
**Common issues:**
- Missing environment variables
- Wrong root directory (should be `chat-app`)
- Node.js version mismatch

**Solutions:**
- Check build logs in Vercel dashboard
- Ensure all `VITE_*` variables are set
- Verify `package.json` in `chat-app` folder

### App Loads but API Calls Fail
**Check:**
- `VITE_API_URL` points to Railway URL with `/api`
- Railway backend is running
- CORS is configured correctly in Railway

### Socket.IO Not Connecting
**Check:**
- `VITE_SOCKET_URL` points to Railway URL (without `/api`)
- Railway supports WebSockets (it does!)
- Browser console for connection errors

### Environment Variables Not Working
**Solutions:**
- Redeploy after adding variables
- Check variable names start with `VITE_`
- Verify variables are set for correct environment

## 📊 Vercel Features

### Analytics
- **Web Analytics**: Page views, performance
- **Speed Insights**: Core Web Vitals
- **Audience Insights**: User behavior

### Monitoring
- **Functions**: Monitor serverless functions
- **Edge Network**: Global performance
- **Real-time logs**: Debug issues

### Team Collaboration
- **Preview deployments**: Test before production
- **Comments**: Review deployments
- **Git integration**: Automatic deployments

## 🎯 Deployment Checklist

### Before Deployment:
- [ ] Railway backend is deployed and working
- [ ] Railway URL is copied
- [ ] All environment variables are prepared

### During Deployment:
- [ ] Root directory set to `chat-app`
- [ ] All environment variables added
- [ ] Deployment successful

### After Deployment:
- [ ] Frontend loads without errors
- [ ] API calls work (login/register)
- [ ] Socket.IO connects (check console)
- [ ] Railway environment variables updated
- [ ] Full app functionality tested

## 💡 Pro Tips

1. **Use Vercel CLI** for faster deployments:
   ```bash
   npm install -g vercel
   cd chat-app
   vercel
   ```

2. **Preview deployments** for testing:
   ```bash
   vercel --prod  # Deploy to production
   vercel         # Deploy to preview
   ```

3. **Environment-specific variables**:
   - Production: Live app
   - Preview: Pull request previews
   - Development: Local development

4. **Monitor performance**:
   - Enable Web Analytics
   - Check Core Web Vitals
   - Optimize based on insights

## 🔄 Update Process

When you make changes:
1. **Push to GitHub** → Automatic deployment
2. **Check preview** → Test changes
3. **Merge to main** → Production deployment
4. **Monitor logs** → Ensure everything works
