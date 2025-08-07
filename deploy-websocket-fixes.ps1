# Deployment script for WebSocket fixes

# Navigate to the project root directory
cd c:\Users\darel\Desktop\FinalProject

# Make a backup of the original socket service
cp chat-app\src\services\socket.js chat-app\src\services\socket.js.bak

# Replace with the enhanced socket service
cp chat-app\src\services\enhanced-socket.js chat-app\src\services\socket.js

# Deploy chat-app to Vercel
cd chat-app
vercel --prod

echo "Deployment completed. WebSocket connection errors should be fixed!"
