$deployTitle = "Deploying Fixed Friends and Chat System"
$deployDescription = "Deploying a new version with fixed friend acceptance and chat creation"

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
