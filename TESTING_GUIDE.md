# Deployment Testing Guide

## 🧪 Complete Testing Checklist

### Phase 1: Backend Testing (Railway)

#### 1.1 Health Check
- [ ] Visit: `https://your-railway-url.up.railway.app/api/health`
- [ ] Expected: `{"status":"OK","message":"ChatChout server is running","timestamp":"..."}`
- [ ] Status code: 200

#### 1.2 CORS Configuration
- [ ] Check Railway logs for CORS messages
- [ ] No CORS errors in browser console when accessing from Vercel URL

#### 1.3 Database Connection
- [ ] Check Railway logs for MongoDB connection success
- [ ] Look for: "✅ Connected to MongoDB successfully"

#### 1.4 Socket.IO Setup
- [ ] Check Railway logs for Socket.IO initialization
- [ ] Look for: "🔌 Setting up Socket.IO handlers..."

### Phase 2: Frontend Testing (Vercel)

#### 2.1 Basic Loading
- [ ] Visit your Vercel URL
- [ ] Page loads without errors
- [ ] No console errors related to missing assets

#### 2.2 Environment Variables
- [ ] Open browser console
- [ ] Check that API calls go to Railway URL
- [ ] Verify Socket.IO attempts connection to Railway

#### 2.3 API Connectivity
- [ ] Try to access login page
- [ ] Check network tab for API calls
- [ ] Verify calls go to `https://your-railway-url.up.railway.app/api`

### Phase 3: Authentication Testing

#### 3.1 User Registration
- [ ] Go to signup page
- [ ] Create a new account
- [ ] Check for successful registration
- [ ] Verify redirect to chat app

#### 3.2 User Login
- [ ] Go to login page
- [ ] Login with created account
- [ ] Check for successful authentication
- [ ] Verify JWT token storage

#### 3.3 Protected Routes
- [ ] Try accessing chat without login (should redirect)
- [ ] Login and access chat (should work)
- [ ] Logout and verify redirect

### Phase 4: Real-time Features Testing

#### 4.1 Socket.IO Connection
- [ ] Login to the app
- [ ] Open browser console
- [ ] Look for: "✅ Connected to server" or similar
- [ ] Check connection status in app UI

#### 4.2 Real-time Messaging
- [ ] Open app in two different browsers/tabs
- [ ] Login with different accounts
- [ ] Send message from one account
- [ ] Verify message appears in real-time on other account

#### 4.3 Online Status
- [ ] Check if users show as online
- [ ] Test going offline/online
- [ ] Verify status updates in real-time

### Phase 5: Advanced Features Testing

#### 5.1 File Upload
- [ ] Try uploading profile picture
- [ ] Try sending file in chat
- [ ] Verify files are stored and accessible

#### 5.2 Video Calls (if enabled)
- [ ] Try initiating video call
- [ ] Check Stream.io integration
- [ ] Verify video/audio functionality

#### 5.3 Notifications
- [ ] Test browser notifications
- [ ] Check notification permissions
- [ ] Verify notification content

## 🔧 Debugging Tools

### Browser Console Commands

```javascript
// Check environment variables
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Socket URL:', import.meta.env.VITE_SOCKET_URL);

// Check authentication
console.log('Auth token:', localStorage.getItem('token'));
console.log('User data:', localStorage.getItem('user'));

// Check Socket.IO connection
if (window.io) {
  console.log('Socket.IO available');
  console.log('Socket connected:', socket.connected);
}
```

### Network Tab Checks
- [ ] API calls return 200 status
- [ ] WebSocket connection established
- [ ] No 404 errors for assets
- [ ] CORS headers present

### Railway Logs to Monitor
```
✅ Connected to MongoDB successfully
🔌 Setting up Socket.IO handlers...
🚀 Server running on port 5000
✅ ChatChout server is ready!
```

### Vercel Logs to Monitor
- [ ] Build successful
- [ ] No environment variable warnings
- [ ] Assets deployed correctly

## 🚨 Common Issues & Solutions

### Issue: CORS Errors
**Symptoms:** Console shows CORS policy errors
**Solution:**
1. Check `CLIENT_URL` in Railway matches Vercel URL exactly
2. Ensure no trailing slashes mismatch
3. Redeploy Railway after updating

### Issue: Socket.IO Won't Connect
**Symptoms:** "Connection failed" in console
**Solution:**
1. Verify `VITE_SOCKET_URL` points to Railway (not Vercel)
2. Check Railway logs for WebSocket errors
3. Ensure Railway is running and accessible

### Issue: API Calls Fail
**Symptoms:** 404 or network errors for API calls
**Solution:**
1. Verify `VITE_API_URL` includes `/api` at the end
2. Check Railway health endpoint works
3. Verify environment variables in Vercel

### Issue: Authentication Fails
**Symptoms:** Login doesn't work, token issues
**Solution:**
1. Check JWT_SECRET is set in Railway
2. Verify MongoDB connection in Railway logs
3. Check browser storage for token

## ✅ Success Criteria

### Minimum Viable Deployment
- [ ] Frontend loads on Vercel
- [ ] Backend responds on Railway
- [ ] User can register/login
- [ ] Basic messaging works (even without real-time)

### Full Feature Deployment
- [ ] All above criteria met
- [ ] Socket.IO connects successfully
- [ ] Real-time messaging works
- [ ] Online status updates
- [ ] File uploads work
- [ ] Video calls functional (if enabled)

## 📊 Performance Testing

### Frontend Performance
- [ ] Page load time < 3 seconds
- [ ] First contentful paint < 1.5 seconds
- [ ] No console errors or warnings

### Backend Performance
- [ ] API response time < 500ms
- [ ] Socket.IO connection time < 2 seconds
- [ ] Database queries optimized

### Load Testing (Optional)
```bash
# Install artillery for load testing
npm install -g artillery

# Test API endpoints
artillery quick --count 10 --num 5 https://your-railway-url.up.railway.app/api/health
```

## 🎯 Final Verification

After all tests pass:
1. **Document your URLs** in a safe place
2. **Share with team** for additional testing
3. **Monitor for 24 hours** to catch any issues
4. **Set up monitoring** alerts if needed
5. **Create backup plan** for rollbacks if needed

## 💡 Pro Tips

1. **Test in incognito mode** to avoid cache issues
2. **Use different devices** (mobile, desktop)
3. **Test with slow internet** to verify loading
4. **Monitor Railway/Vercel dashboards** during testing
5. **Keep logs open** while testing for real-time debugging
