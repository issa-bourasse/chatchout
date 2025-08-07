Write-Host "Deploying fixed messages API endpoints..."

# Create directory for the fixed messages API
$fixedMessagesDir = ".\vercel-fixed-messages"
if (Test-Path $fixedMessagesDir) {
    Remove-Item -Path $fixedMessagesDir -Recurse -Force
}
New-Item -ItemType Directory -Path $fixedMessagesDir | Out-Null
New-Item -ItemType Directory -Path "$fixedMessagesDir\api" | Out-Null
New-Item -ItemType Directory -Path "$fixedMessagesDir\api\messages" | Out-Null

# Create the vercel.json file with appropriate configuration
$vercelConfig = @{
    version = 2
    functions = @{
        "api/messages/[chatId].js" = @{
            runtime = "nodejs18.x"
            memory = 1024
        }
        "api/messages.js" = @{
            runtime = "nodejs18.x"
            memory = 1024
        }
    }
    routes = @(
        @{
            src = "/api/messages"
            dest = "/api/messages.js"
            methods = @("POST", "OPTIONS")
        }
        @{
            src = "/api/messages/(.*)"
            dest = "/api/messages/[chatId].js"
            methods = @("GET", "OPTIONS")
        }
    )
} | ConvertTo-Json -Depth 10

Set-Content -Path "$fixedMessagesDir\vercel.json" -Value $vercelConfig

# Copy the fixed messages API implementations
Copy-Item -Path ".\server\api\messages\[chatId].js" -Destination "$fixedMessagesDir\api\messages\[chatId].js" -Force
Copy-Item -Path ".\server\api\fixed-messages-api.js" -Destination "$fixedMessagesDir\api\messages.js" -Force
Copy-Item -Path ".\server\api\allowCors.js" -Destination "$fixedMessagesDir\api\allowCors.js" -Force

# Create package.json for the function
$packageJson = @{
    name = "chat-app-fixed-messages-api"
    version = "1.0.0"
    dependencies = @{
        mongodb = "^6.1.0"
        "jsonwebtoken" = "^9.0.0"
    }
} | ConvertTo-Json

Set-Content -Path "$fixedMessagesDir\package.json" -Value $packageJson

# Deploy to Vercel
Set-Location $fixedMessagesDir
vercel --prod

# Clean up
Set-Location ..
Write-Host "Fixed Messages API deployment completed!"
Write-Host "Your new API endpoint should be available at: https://chatchout-res1.vercel.app/api/messages/[chatId]"
