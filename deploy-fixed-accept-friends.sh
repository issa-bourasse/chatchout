#!/bin/bash
# Deploy friend request accept fix

echo -e "\e[32mDeploying fix for friend request acceptance...\e[0m"

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
cd "../chat-app"
vercel --prod

# Return to the root directory
cd ..

echo -e "\e[32mDeployment completed!\e[0m"
echo -e "\e[36mFriend request acceptance functionality is now fixed.\e[0m"

# Test instructions
echo -e "\e[33mTo test the fix:\e[0m"
echo -e "\e[33m1. Log in to the application\e[0m"
echo -e "\e[33m2. Check if there are pending friend requests\e[0m"
echo -e "\e[33m3. Try to accept a friend request\e[0m"
echo -e "\e[33m4. Check the browser console for debugging logs\e[0m"
