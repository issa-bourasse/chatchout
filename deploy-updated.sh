#!/bin/bash

# Deploy updated ChatChout application to Vercel
# This script assumes you have the Vercel CLI installed and are logged in

echo "🚀 Deploying ChatChout to Vercel..."

# Step 1: Deploy backend
echo "📡 Deploying backend..."
cd server
vercel --prod

# Step 2: Get the new backend URL
echo "🔍 Getting backend URL..."
BACKEND_URL=$(vercel --prod -q)
echo "Backend URL: $BACKEND_URL"

# Step 3: Update frontend environment variables
echo "🔧 Updating frontend environment variables..."
cd ../chat-app
echo "VITE_API_URL=${BACKEND_URL}/api" > .env.production
echo "VITE_SOCKET_URL=${BACKEND_URL}" >> .env.production
echo "VITE_STREAM_API_KEY=twe26yayd39n" >> .env.production

# Step 4: Deploy frontend
echo "🎨 Deploying frontend..."
vercel --prod

echo "✅ Deployment complete!"
echo "📝 Remember to check the following:"
echo "  1. Test registration with the fixed handler"
echo "  2. Test login with the fixed login handler"
echo "  3. Test authentication with the auth test endpoint: ${BACKEND_URL}/api/auth/test"
echo "  4. Test user search and chat listing endpoints"
echo "  5. Test logout functionality"

echo "🔍 Debugging Tips:"
echo "  - Check browser console for error messages"
echo "  - Examine localStorage for the authentication token"
echo "  - Review Vercel function logs for server-side errors"
echo "  - Use auth test endpoint to verify token validity"

echo "🔗 See FIELD_NAMING.md for details on the authentication architecture"
