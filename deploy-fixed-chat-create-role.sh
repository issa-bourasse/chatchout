#!/bin/bash

DEPLOY_TITLE="Deploying Fixed Chat Creation - Role Fix"
DEPLOY_DESCRIPTION="Deploying with fixed participant role values in chat creation"

# Change to the server directory
cd "$(dirname "$0")/server"

# Display what we're deploying
echo -e "\033[0;32m🚀 $DEPLOY_TITLE\033[0m"
echo -e "\033[0;36m📝 $DEPLOY_DESCRIPTION\033[0m"
echo ""

# Deploy the server with Vercel
echo "📦 Deploying server..."
vercel --prod

echo -e "\033[0;32m✅ Deployment completed!\033[0m"
