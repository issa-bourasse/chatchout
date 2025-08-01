# Deploy updates with socket and video call disabled
Write-Host "Deploying updated version with disabled features..." -ForegroundColor Green

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
Write-Host "WebSocket and Video Call features are now disabled to fix the login stability issues." -ForegroundColor Cyan
