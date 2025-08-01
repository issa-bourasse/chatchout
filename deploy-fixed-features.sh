#!/bin/bash
# Deploy updates with socket and video call disabled

echo -e "\e[32mDeploying updated version with disabled features...\e[0m"

# Verify we're in the right directory
if [ ! -d "./server" ] || [ ! -d "./chat-app" ]; then
    echo -e "\e[31mError: Run this script from the project root directory\e[0m"
    exit 1
fi

# Deploy the server changes first
echo -e "\e[36mDeploying server changes...\e[0m"
cd ./server
vercel --prod

# Wait a bit for server deployment to complete
echo -e "\e[33mWaiting for server deployment to complete...\e[0m"
sleep 10

# Now deploy the frontend
echo -e "\e[36mDeploying frontend changes...\e[0m"
cd ../chat-app
vercel --prod

# Return to the root directory
cd ..

echo -e "\e[32mDeployment completed!\e[0m"
echo -e "\e[36mWebSocket and Video Call features are now disabled to fix the login stability issues.\e[0m"
