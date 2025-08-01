# ChatChout Deployment Script (PowerShell version)
# This script deploys the application to Vercel and tests the API endpoints

Write-Host "🚀 Deploying ChatChout to Vercel" -ForegroundColor Cyan
Write-Host "---------------------------------" -ForegroundColor Cyan

# Check which files are included in the deployment
Write-Host "📋 Checking deployment files..." -ForegroundColor Yellow
Set-Location -Path .\server
$apiFiles = Get-ChildItem -Path .\api\*.js | Select-Object -ExpandProperty Name

Write-Host "Found $($apiFiles.Count) API files:" -ForegroundColor Yellow
foreach ($file in $apiFiles) {
    # Mark consolidated files with a different color
    if ($file -like "consolidated-*") {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ℹ️ $file" -ForegroundColor Gray
    }
}

# Check if there are too many files and prompt for cleanup
if ($apiFiles.Count -gt 10) {
    Write-Host "`n⚠️ Warning: You have more than 10 API files!" -ForegroundColor Red
    Write-Host "   Vercel Hobby plan has a limit of 12 serverless functions." -ForegroundColor Red
    Write-Host "   Consider using only the consolidated handlers to stay within limits." -ForegroundColor Red
    
    $confirmation = Read-Host "Would you like to proceed with deployment anyway? (y/n)"
    if ($confirmation -ne 'y') {
        Write-Host "Deployment canceled. Please optimize your API handlers first." -ForegroundColor Red
        Set-Location -Path ..
        exit
    }
}

# Deploy backend
Write-Host "`n🚀 Deploying backend..." -ForegroundColor Yellow
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
Write-Host "5. See VERCEL_FUNCTION_LIMIT.md for information on optimizing function count" -ForegroundColor White
