# ChatChout Vercel Deployment Guide

## New Backend URLs

Your backend is now deployed at the following URLs:
- `https://chatchout-res1.vercel.app`
- `https://chatchout-res1-git-main-cheimabarhoumis-projects.vercel.app`
- `https://chatchout-res1-8fi6ir2sp-cheimabarhoumis-projects.vercel.app`

## Changes Made to Fix CORS Issues

1. **Updated CORS in `server/api/auth/register.js`**:
   - Added all the possible frontend domains to the origin list
   - Added wildcard origin (`*`) to ensure all requests go through

2. **Updated `vercel.json`**:
   - Added specific route for `/api/auth/register`
   - Set CORS headers with wildcard origin
   - Configured proper OPTIONS handling

3. **Updated `server/api/auth-register.js`**:
   - Changed CORS headers to use wildcard origin
   - Properly handles OPTIONS preflight requests

4. **Updated `server/api/cors-override.js`**:
   - Added explicit OPTIONS handler
   - Enhanced CORS configuration

5. **Updated Environment Variables**:
   - Added comments in `.env.example` with all possible frontend URLs

## Deployment Steps

1. **Push Changes to GitHub**:
   ```
   git add .
   git commit -m "Update CORS for new Vercel deployment"
   git push
   ```

2. **Update Environment Variables on Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Set `NODE_ENV` to `production`
   - Set `CLIENT_URL` to your frontend URL (any of the ones listed above)
   - Ensure all other variables match your `.env.example` file

3. **Redeploy Backend**:
   - After pushing changes, Vercel should automatically redeploy
   - Alternatively, manually redeploy from the Vercel dashboard

4. **Test Your Endpoints**:
   - Try registering a new user from your frontend
   - Check the browser's Network tab for any CORS errors
   - If errors persist, temporarily try a browser CORS plugin

## Troubleshooting

If you still encounter CORS issues:

1. **Check Browser Network Tab**:
   - Look for the specific CORS error message
   - Verify what domain is making the request vs. what's allowed

2. **Verify Environment Variables**:
   - Make sure `CLIENT_URL` is set correctly on Vercel
   - Check that all other variables are set properly

3. **Check Frontend API Configuration**:
   - Ensure your frontend is using the correct backend URL
   - Look for hardcoded URLs that might need updating

4. **Last Resort Option**:
   - Try using a CORS browser extension to temporarily bypass CORS
   - This is only for testing - never rely on this for production!

## Security Considerations

The current CORS configuration uses a wildcard origin (`*`), which allows requests from any domain. This is not secure for production use but helps diagnose CORS issues.

Once your application is working properly, you should update the CORS configuration to only allow specific domains:

```javascript
// Change this:
origin: '*'

// To this:
origin: [
  'https://chatchout.vercel.app',
  'https://chatchout-res1.vercel.app',
  // Add other specific domains as needed
]
```

## Frontend Configuration

Make sure your frontend's API configuration is pointing to your new backend URL:

```javascript
// In your frontend API configuration file
const API_BASE_URL = 'https://chatchout-res1.vercel.app/api';
```
