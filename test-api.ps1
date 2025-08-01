# ChatChout API Test Script (PowerShell version)
# This script tests all the API endpoints after deployment
# Note: The backend has been optimized to use consolidated handlers to stay within Vercel's function limits

$BaseUrl = "https://chatchout-api.vercel.app/api"
$Token = ""
$Email = "test@example.com"
$Password = "Test123!"

Write-Host "🧪 Testing ChatChout API endpoints" -ForegroundColor Cyan
Write-Host "---------------------------------" -ForegroundColor Cyan

# Test registration
function Test-Registration {
    Write-Host "📝 Testing registration..." -ForegroundColor Yellow
    
    $body = @{
        name = "Test User"
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/auth/register" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
        Write-Host "✅ Registration successful" -ForegroundColor Green
        
        # Set token for other tests
        $script:Token = $response.token
        Write-Host "   Token: $($Token.Substring(0, [Math]::Min(20, $Token.Length)))..." -ForegroundColor Gray
        
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.ErrorDetails.Message
        Write-Host "❌ Registration failed with status $statusCode" -ForegroundColor Red
        Write-Host $errorMessage -ForegroundColor Red
        return $false
    }
}

# Test login
function Test-Login {
    Write-Host "🔑 Testing login..." -ForegroundColor Yellow
    
    $body = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
        Write-Host "✅ Login successful" -ForegroundColor Green
        
        # Set token for other tests
        $script:Token = $response.token
        Write-Host "   Token: $($Token.Substring(0, [Math]::Min(20, $Token.Length)))..." -ForegroundColor Gray
        
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.ErrorDetails.Message
        Write-Host "❌ Login failed with status $statusCode" -ForegroundColor Red
        Write-Host $errorMessage -ForegroundColor Red
        return $false
    }
}

# Test authentication
function Test-Auth {
    Write-Host "🔒 Testing authentication..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "Authorization" = "Bearer $Token"
        }
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/auth/test" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "✅ Authentication successful" -ForegroundColor Green
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.ErrorDetails.Message
        Write-Host "❌ Authentication failed with status $statusCode" -ForegroundColor Red
        Write-Host $errorMessage -ForegroundColor Red
        return $false
    }
}

# Test user search
function Test-UserSearch {
    Write-Host "🔍 Testing user search..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "Authorization" = "Bearer $Token"
        }
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/users/search?q=test" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "✅ User search successful" -ForegroundColor Green
        Write-Host "   Found $($response.users.Count) users" -ForegroundColor Gray
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.ErrorDetails.Message
        Write-Host "❌ User search failed with status $statusCode" -ForegroundColor Red
        Write-Host $errorMessage -ForegroundColor Red
        return $false
    }
}

# Test chats list
function Test-ChatsList {
    Write-Host "💬 Testing chats list..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "Authorization" = "Bearer $Token"
        }
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/chats?page=1&limit=10" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "✅ Chats list successful" -ForegroundColor Green
        Write-Host "   Found $($response.chats.Count) chats" -ForegroundColor Gray
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.ErrorDetails.Message
        Write-Host "❌ Chats list failed with status $statusCode" -ForegroundColor Red
        Write-Host $errorMessage -ForegroundColor Red
        return $false
    }
}

# Test logout
function Test-Logout {
    Write-Host "🚪 Testing logout..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "Authorization" = "Bearer $Token"
        }
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/auth/logout" -Method POST -Headers $headers -ErrorAction Stop
        Write-Host "✅ Logout successful" -ForegroundColor Green
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.ErrorDetails.Message
        Write-Host "❌ Logout failed with status $statusCode" -ForegroundColor Red
        Write-Host $errorMessage -ForegroundColor Red
        return $false
    }
}

# Run tests
Write-Host "Starting tests..." -ForegroundColor Cyan
Write-Host "---------------------------------" -ForegroundColor Cyan

# First try login, if that fails try registration
$loginSuccess = Test-Login
if (-not $loginSuccess) {
    Write-Host "Login failed, trying registration..." -ForegroundColor Yellow
    $registrationSuccess = Test-Registration
    if (-not $registrationSuccess) {
        Write-Host "❌ Authentication setup failed. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Test other endpoints
Test-Auth
Test-UserSearch
Test-ChatsList
Test-Logout

Write-Host "---------------------------------" -ForegroundColor Cyan
Write-Host "✅ All tests completed" -ForegroundColor Green
