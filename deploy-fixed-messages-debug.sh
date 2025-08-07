#!/bin/bash
echo "Deploying fixed messages API with better debugging..."

# Create directory for the fixed messages API
fixedMessagesDir="./vercel-fixed-debug"
rm -rf "$fixedMessagesDir"
mkdir -p "$fixedMessagesDir/api/messages"

# Create the vercel.json file with appropriate configuration
cat > "$fixedMessagesDir/vercel.json" << EOF
{
  "version": 2,
  "functions": {
    "api/messages/[chatId].js": {
      "runtime": "nodejs18.x",
      "memory": 1024
    },
    "api/messages.js": {
      "runtime": "nodejs18.x",
      "memory": 1024
    }
  },
  "routes": [
    {
      "src": "/api/messages",
      "dest": "/api/messages.js",
      "methods": ["POST", "OPTIONS"]
    },
    {
      "src": "/api/messages/(.*)",
      "dest": "/api/messages/[chatId].js",
      "methods": ["GET", "OPTIONS"]
    },
    {
      "src": "/api/api/messages/(.*)",
      "dest": "/api/messages/[chatId].js",
      "methods": ["GET", "OPTIONS"]
    },
    {
      "src": "/api/api/messages",
      "dest": "/api/messages.js",
      "methods": ["POST", "OPTIONS"]
    }
  ]
}
EOF

# Copy the fixed messages API implementations
cp "./server/api/messages/fixed-[chatId].js" "$fixedMessagesDir/api/messages/[chatId].js"
cp "./server/api/fixed-messages-post.js" "$fixedMessagesDir/api/messages.js"

# Create package.json for the function
cat > "$fixedMessagesDir/package.json" << EOF
{
  "name": "chat-app-fixed-messages-debug",
  "version": "1.0.0",
  "dependencies": {
    "mongodb": "^6.1.0",
    "jsonwebtoken": "^9.0.0"
  }
}
EOF

# Deploy to Vercel
cd "$fixedMessagesDir"
vercel --prod

# Clean up
cd ..
echo "Fixed Messages API deployment completed!"
echo "Your new API endpoints should be available at:"
echo "GET: https://chatchout-res1.vercel.app/api/messages/[chatId]"
echo "POST: https://chatchout-res1.vercel.app/api/messages"
