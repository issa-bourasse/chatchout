Write-Host "Deploying fixed messages API with better debugging..."

# Create directory for the fixed messages API
$fixedMessagesDir = ".\vercel-fixed-debug"
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
        # POST messages route
        @{
            src = "/api/messages"
            dest = "/api/messages.js"
            methods = @("POST", "OPTIONS")
        }
        # GET messages route - handle both standard path and duplicated /api path
        @{
            src = "/api/messages/(.*)"
            dest = "/api/messages/[chatId].js"
            methods = @("GET", "OPTIONS")
        }
        @{
            src = "/api/api/messages/(.*)"
            dest = "/api/messages/[chatId].js"
            methods = @("GET", "OPTIONS")
        }
        # Double API path for POST requests too
        @{
            src = "/api/api/messages"
            dest = "/api/messages.js"
            methods = @("POST", "OPTIONS")
        }
    )
} | ConvertTo-Json -Depth 10

Set-Content -Path "$fixedMessagesDir\vercel.json" -Value $vercelConfig

# Copy the fixed messages API implementations
Copy-Item -Path ".\server\api\messages\fixed-[chatId].js" -Destination "$fixedMessagesDir\api\messages\[chatId].js" -Force
Copy-Item -Path ".\server\api\fixed-messages-post.js" -Destination "$fixedMessagesDir\api\messages.js" -Force

# Create package.json for the function
$packageJson = @{
    name = "chat-app-fixed-messages-debug"
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
Write-Host "Your new API endpoints should be available at:"
Write-Host "GET: https://chatchout-res1.vercel.app/api/messages/[chatId]"
Write-Host "POST: https://chatchout-res1.vercel.app/api/messages"
