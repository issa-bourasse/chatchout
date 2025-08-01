# Deploy friends functionality fix
Write-Host "Deploying updated version with fixed friends functionality..." -ForegroundColor Green

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

# Return to the root directory
Set-Location -Path ".."

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Friends functionality is now fixed." -ForegroundColor Cyan
Write-Host "You can check the status of a user's friend connections by visiting:" -ForegroundColor Yellow
Write-Host "https://chatchout-res1.vercel.app/api/friends/debug?email=user@example.com" -ForegroundColor Yellow
Write-Host "(Replace user@example.com with the actual user email)" -ForegroundColor Yellow
