Write-Host "Deploying fixed messages API endpoints..."

# Create directory for messages API
$messagesDir = ".\vercel-messages"
if (Test-Path $messagesDir) {
    Remove-Item -Path $messagesDir -Recurse -Force
}
New-Item -ItemType Directory -Path $messagesDir | Out-Null

# Create the vercel.json file
$vercelConfig = @{
    version = 2
    functions = @{
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
            dest = "/api/messages.js?chatId=$1"
            methods = @("GET", "OPTIONS")
        }
    )
} | ConvertTo-Json -Depth 10

Set-Content -Path "$messagesDir\vercel.json" -Value $vercelConfig

# Copy necessary files
Copy-Item -Path ".\server\api\consolidated-messages.js" -Destination "$messagesDir\api\messages.js" -Force
Copy-Item -Path ".\server\api\allowCors.js" -Destination "$messagesDir\api\allowCors.js" -Force
Copy-Item -Path ".\server\api\auth-middleware-new.js" -Destination "$messagesDir\api\auth-middleware-new.js" -Force
Copy-Item -Path ".\server\models\Message.js" -Destination "$messagesDir\api\Message.js" -Force
Copy-Item -Path ".\server\models\Chat.js" -Destination "$messagesDir\api\Chat.js" -Force
Copy-Item -Path ".\server\models\User.js" -Destination "$messagesDir\api\User.js" -Force

# Create package.json for the function
$packageJson = @{
    name = "chat-app-messages-api"
    version = "1.0.0"
    dependencies = @{
        mongoose = "^7.0.3"
        "jsonwebtoken" = "^9.0.0"
        cookie = "^0.5.0"
        "cookie-parser" = "^1.4.6"
        dotenv = "^16.0.3"
    }
} | ConvertTo-Json

Set-Content -Path "$messagesDir\package.json" -Value $packageJson

# Deploy to Vercel
Set-Location $messagesDir
vercel --prod

# Clean up
Set-Location ..
Write-Host "Messages API deployment completed!"
