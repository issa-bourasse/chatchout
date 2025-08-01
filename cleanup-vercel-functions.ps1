# ChatChout Vercel Function Optimization Script
# This script helps clean up unused API files to stay within Vercel's function limits

Write-Host "🧹 ChatChout Vercel Function Cleanup" -ForegroundColor Cyan
Write-Host "---------------------------------" -ForegroundColor Cyan

# Check current API files
Set-Location -Path .\server
$apiFiles = Get-ChildItem -Path .\api\*.js | Select-Object -ExpandProperty Name

Write-Host "Found $($apiFiles.Count) API files:" -ForegroundColor Yellow
foreach ($file in $apiFiles) {
    # Mark consolidated files with a different color
    if ($file -like "consolidated-*") {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } elseif ($file -like "auth-middleware*.js" -or $file -like "allowCors.js") {
        Write-Host "  ⚙️ $file (required utility)" -ForegroundColor Blue
    } else {
        Write-Host "  ℹ️ $file" -ForegroundColor Gray
    }
}

Write-Host "`nVercel Hobby plan has a limit of 12 serverless functions." -ForegroundColor Yellow
Write-Host "Your current setup uses the following consolidated handlers:" -ForegroundColor Yellow
Write-Host "  - consolidated-api.js: Handles login, logout, user search, and chats list" -ForegroundColor White
Write-Host "  - consolidated-auth.js: Handles registration and auth testing" -ForegroundColor White

$confirmation = Read-Host "`nWould you like to archive unused API files to optimize your deployment? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Operation canceled." -ForegroundColor Red
    Set-Location -Path ..
    exit
}

# Create archive folder if it doesn't exist
if (-not (Test-Path -Path .\api\_archived)) {
    New-Item -Path .\api\_archived -ItemType Directory | Out-Null
    Write-Host "Created archive folder: api/_archived" -ForegroundColor Gray
}

# List of files that should be kept
$filesToKeep = @(
    "consolidated-api.js",
    "consolidated-auth.js",
    "auth-middleware-new.js",
    "auth-middleware.js",
    "allowCors.js",
    "cors-test.js"
)

# Move unused files to archive
$movedCount = 0
foreach ($file in $apiFiles) {
    if ($filesToKeep -notcontains $file) {
        Move-Item -Path ".\api\$file" -Destination ".\api\_archived\$file" -Force
        Write-Host "Archived: $file" -ForegroundColor Gray
        $movedCount++
    }
}

Write-Host "`n✅ Operation completed! Archived $movedCount files." -ForegroundColor Green
Write-Host "Files have been moved to api/_archived folder and won't be deployed." -ForegroundColor Green
Write-Host "You can restore them later if needed." -ForegroundColor Green

# Check remaining files
$remainingFiles = Get-ChildItem -Path .\api\*.js | Select-Object -ExpandProperty Name
Write-Host "`nRemaining $($remainingFiles.Count) API files:" -ForegroundColor Yellow
foreach ($file in $remainingFiles) {
    Write-Host "  - $file" -ForegroundColor White
}

Write-Host "`nYou should now be able to deploy to Vercel within the function limit." -ForegroundColor Cyan
Set-Location -Path ..
