# Add Environment Variables to Vercel Backend

## 🚀 Your Backend is Deployed!

**Backend URL:** https://chatchout-backend-rettwpyhc-cheimabarhoumis-projects.vercel.app

## 🔧 Next Step: Add Environment Variables

Go to: https://vercel.com/cheimabarhoumis-projects/chatchout-backend/settings/environment-variables

Add these environment variables one by one:

### NODE_ENV
- **Key:** `NODE_ENV`
- **Value:** `production`
- **Environment:** Production

### MONGODB_URI
- **Key:** `MONGODB_URI`
- **Value:** `mongodb+srv://admin:admin12345$@cluster0.sbge678.mongodb.net/chatchout?retryWrites=true&w=majority&appName=Cluster0`
- **Environment:** Production

### JWT_SECRET
- **Key:** `JWT_SECRET`
- **Value:** `chatchout_super_secure_jwt_secret_2024_production_key_32_chars_minimum`
- **Environment:** Production

### JWT_EXPIRE
- **Key:** `JWT_EXPIRE`
- **Value:** `7d`
- **Environment:** Production

### CLIENT_URL
- **Key:** `CLIENT_URL`
- **Value:** `https://chatchout.vercel.app`
- **Environment:** Production

### STREAM_API_KEY
- **Key:** `STREAM_API_KEY`
- **Value:** `twe26yayd39n`
- **Environment:** Production

### STREAM_API_SECRET
- **Key:** `STREAM_API_SECRET`
- **Value:** `your_stream_secret_here`
- **Environment:** Production

## 🔄 After Adding Variables

1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Wait for redeployment to complete
4. Test the health endpoint: https://chatchout-backend-rettwpyhc-cheimabarhoumis-projects.vercel.app/api/health

## 🧪 Testing

After adding environment variables and redeploying, test:

**Health Check:**
```
https://chatchout-backend-rettwpyhc-cheimabarhoumis-projects.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "ChatChout server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔗 Update Frontend

Update your frontend environment variable:
- **Key:** `VITE_API_URL`
- **Value:** `https://chatchout-backend-rettwpyhc-cheimabarhoumis-projects.vercel.app/api`

Your ChatChout backend is now live! 🎉
