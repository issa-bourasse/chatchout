#!/bin/bash

# ChatChout Deployment Script for Vercel
echo "🚀 Starting ChatChout deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📦 Building frontend..."
cd chat-app
npm run build

echo "🌐 Deploying frontend to Vercel..."
vercel --prod

echo "⚙️ Deploying backend to Vercel..."
cd ../server
vercel --prod

echo "✅ Deployment complete!"
echo "📝 Don't forget to:"
echo "   1. Set environment variables in Vercel dashboard"
echo "   2. Update CORS settings with your domain URLs"
echo "   3. Test all functionality"

cd ..
