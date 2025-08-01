#!/bin/bash

# ChatChout Deployment Script
# This script deploys the application to Vercel and tests the API endpoints

echo "🚀 Deploying ChatChout to Vercel"
echo "---------------------------------"

# Check which files are included in the deployment
echo "📋 Checking deployment files..."
cd server
API_FILES=$(ls -1 api/*.js | wc -l)
echo "Found $API_FILES API files:"

# List consolidated files first
echo -e "\n✅ Consolidated handlers:"
ls -1 api/consolidated-*.js 2>/dev/null | sed 's/api\//  /'

# List other API files
echo -e "\nℹ️ Other API files:"
ls -1 api/*.js | grep -v "consolidated-" | sed 's/api\//  /'

# Check if there are too many files and prompt for cleanup
if [ $API_FILES -gt 10 ]; then
    echo -e "\n⚠️ Warning: You have more than 10 API files!"
    echo "   Vercel Hobby plan has a limit of 12 serverless functions."
    echo "   Consider using only the consolidated handlers to stay within limits."
    
    read -p "Would you like to proceed with deployment anyway? (y/n) " CONFIRM
    if [ "$CONFIRM" != "y" ]; then
        echo "Deployment canceled. Please optimize your API handlers first."
        cd ..
        exit 1
    fi
fi

# Deploy backend
echo -e "\n🚀 Deploying backend..."
vercel --prod

# Wait for deployment to propagate
echo "Waiting for deployment to propagate (30 seconds)..."
sleep 30

# Run API tests
echo "Testing API endpoints..."
cd ..
bash test-api.sh

echo "---------------------------------"
echo "Deployment completed!"
echo ""
echo "📝 Important notes:"
echo "1. Make sure to set the correct API URL in your frontend .env file"
echo "2. Test the full authentication flow in the frontend"
echo "3. If issues persist, check Vercel logs for detailed error messages"
echo "4. See AUTH_GUIDE.md for comprehensive authentication information"
echo "5. See VERCEL_FUNCTION_LIMIT.md for information on optimizing function count"
