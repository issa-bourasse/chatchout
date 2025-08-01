$deployTitle = "Deploying Fixed Chat ID Format"
$deployDescription = "Deploying with consistent id/\_id handling in chat responses"

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
