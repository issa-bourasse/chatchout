#!/bin/bash

echo "Deploying fixed messages API endpoints..."

# Create directory for messages API
messagesDir="./vercel-messages"
rm -rf $messagesDir
mkdir -p $messagesDir/api

# Create vercel.json
cat > $messagesDir/vercel.json << EOL
{
  "version": 2,
  "functions": {
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
      "dest": "/api/messages.js?chatId=\$1",
      "methods": ["GET", "OPTIONS"]
    }
  ]
}
EOL

# Copy necessary files
cp ./server/api/consolidated-messages.js $messagesDir/api/messages.js
cp ./server/api/allowCors.js $messagesDir/api/allowCors.js
cp ./server/api/auth-middleware-new.js $messagesDir/api/auth-middleware-new.js
cp ./server/models/Message.js $messagesDir/api/Message.js
cp ./server/models/Chat.js $messagesDir/api/Chat.js
cp ./server/models/User.js $messagesDir/api/User.js

# Create package.json
cat > $messagesDir/package.json << EOL
{
  "name": "chat-app-messages-api",
  "version": "1.0.0",
  "dependencies": {
    "mongoose": "^7.0.3",
    "jsonwebtoken": "^9.0.0",
    "cookie": "^0.5.0",
    "cookie-parser": "^1.4.6",
    "dotenv": "^16.0.3"
  }
}
EOL

# Deploy to Vercel
cd $messagesDir
vercel --prod

# Clean up
cd ..
echo "Messages API deployment completed!"
