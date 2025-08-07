# Deployment script for fixing the message input

# Navigate to the root directory
cd c:\Users\darel\Desktop\FinalProject

# Deploy the server changes
cd server
vercel --prod

# Deploy the chat app changes
cd ../chat-app
vercel --prod

echo "Deployment completed. The chat input field should now be working."
