# ChatChout Deployment Script (PowerShell version)
# This script deploys the application to Vercel and tests the API endpoints

Write-Host "🚀 Deploying ChatChout to Vercel" -ForegroundColor Cyan
Write-Host "---------------------------------" -ForegroundColor Cyan

# Deploy backend
Write-Host "Deploying backend..." -ForegroundColor Yellow
Set-Location -Path .\server
vercel --prod

# Wait for deployment to propagate
Write-Host "Waiting for deployment to propagate (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Run API tests
Write-Host "Testing API endpoints..." -ForegroundColor Yellow
Set-Location -Path ..
.\test-api.ps1

Write-Host "---------------------------------" -ForegroundColor Cyan
Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Important notes:" -ForegroundColor Yellow
Write-Host "1. Make sure to set the correct API URL in your frontend .env file" -ForegroundColor White
Write-Host "2. Test the full authentication flow in the frontend" -ForegroundColor White
Write-Host "3. If issues persist, check Vercel logs for detailed error messages" -ForegroundColor White
Write-Host "4. See AUTH_GUIDE.md for comprehensive authentication information" -ForegroundColor White
