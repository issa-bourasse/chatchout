# Deploy friend request accept fix
Write-Host "Deploying fix for friend request acceptance..." -ForegroundColor Green

# Verify we're in the right directory
if (!(Test-Path -Path "./server") -or !(Test-Path -Path "./chat-app")) {
    Write-Host "Error: Run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Deploy the server changes first
Write-Host "Deploying server changes..." -ForegroundColor Cyan
Set-Location -Path "./server"
vercel --prod

# Wait a bit for server deployment to complete
Write-Host "Waiting for server deployment to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Now deploy the frontend
Write-Host "Deploying frontend changes..." -ForegroundColor Cyan
Set-Location -Path "../chat-app"
vercel --prod

# Return to the root directory
Set-Location -Path ".."

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Friend request acceptance functionality is now fixed." -ForegroundColor Cyan

# Test instructions
Write-Host "To test the fix:" -ForegroundColor Yellow
Write-Host "1. Log in to the application" -ForegroundColor Yellow
Write-Host "2. Check if there are pending friend requests" -ForegroundColor Yellow
Write-Host "3. Try to accept a friend request" -ForegroundColor Yellow
Write-Host "4. Check the browser console for debugging logs" -ForegroundColor Yellow
