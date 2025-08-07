# Deployment script for fixed messages authentication

# Navigate to the server directory
cd server

# Deploy to Vercel
vercel --prod

echo "Deployment completed. The fixed auth in messages API should now be working."
