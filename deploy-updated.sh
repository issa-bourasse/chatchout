#!/bin/bash

# Deploy updated ChatChout application to Vercel
# This script assumes you have the Vercel CLI installed and are logged in

echo "🚀 Deploying ChatChout to Vercel..."

# Step 0: Check and optimize for function limits
echo "🔍 Checking Vercel function limits..."
cd server
API_FILES=$(find api -name "*.js" | wc -l)
echo "Found $API_FILES API files"

if [ $API_FILES -gt 10 ]; then
  echo "⚠️ Warning: You have more than 10 API files!"
  echo "   Vercel Hobby plan has a limit of 12 serverless functions."
  
  # Check if consolidated handlers exist
  if [ ! -f "api/consolidated-api.js" ] || [ ! -f "api/consolidated-auth.js" ]; then
    echo "❌ Error: Consolidated API handlers not found"
    echo "Please ensure api/consolidated-api.js and api/consolidated-auth.js exist"
    exit 1
  fi
  
  # Update vercel.json to use specific builds
  echo "� Updating vercel.json to limit deployed functions..."
  cp vercel.json vercel.json.bak
  
  # Use jq if available, otherwise use sed
  if command -v jq &> /dev/null; then
    jq '.builds = [
      {"src": "server.js", "use": "@vercel/node"},
      {"src": "api/consolidated-*.js", "use": "@vercel/node"},
      {"src": "api/allowCors.js", "use": "@vercel/node"},
      {"src": "api/auth-middleware-new.js", "use": "@vercel/node"},
      {"src": "api/cors-test.js", "use": "@vercel/node"}
    ]' vercel.json.bak > vercel.json
  else
    # Simple find and replace using sed (less reliable but more widely available)
    sed -i 's/"src": "api\/\*.js"/"src": "api\/consolidated-\*.js"/g' vercel.json
  fi
  
  echo "✅ Updated vercel.json to only include necessary files"
fi

# Step 1: Deploy backend
echo "📡 Deploying backend..."
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

echo "🔗 See AUTH_GUIDE.md for details on the authentication architecture"
echo "🔗 See VERCEL_FUNCTION_LIMIT.md for information on the function limit solution"
