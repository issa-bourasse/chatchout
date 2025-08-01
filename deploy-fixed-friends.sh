#!/bin/bash
# Deploy friends functionality fix

echo -e "\e[32mDeploying updated version with fixed friends functionality...\e[0m"

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

# Return to the root directory
cd ..

echo -e "\e[32mDeployment completed!\e[0m"
echo -e "\e[36mFriends functionality is now fixed.\e[0m"
echo -e "\e[33mYou can check the status of a user's friend connections by visiting:\e[0m"
echo -e "\e[33mhttps://chatchout-res1.vercel.app/api/friends/debug?email=user@example.com\e[0m"
echo -e "\e[33m(Replace user@example.com with the actual user email)\e[0m"
