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
echo "  1. Verify registration flow works with name/username field mapping"
echo "  2. Test login functionality"
echo "  3. Verify chat and video call features"

echo "🔗 See FIELD_NAMING.md for details on the field mapping solution"
