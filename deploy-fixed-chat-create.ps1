$deployTitle = "Deploying Fixed Chat Creation"
$deployDescription = "Deploying with improved error handling in chat creation"

# Change to the server directory
cd "$PSScriptRoot\server"

# Display what we're deploying
Write-Host "🚀 $deployTitle" -ForegroundColor Green
Write-Host "📝 $deployDescription" -ForegroundColor Cyan
Write-Host ""

# Deploy the server with Vercel
Write-Host "📦 Deploying server..."
vercel --prod

Write-Host "✅ Deployment completed!" -ForegroundColor Green
