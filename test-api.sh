#!/bin/bash

# ChatChout API Test Script
# This script tests all the API endpoints after deployment
# Note: The backend has been optimized to use consolidated handlers to stay within Vercel's function limits

BASE_URL="https://chatchout-api.vercel.app/api"
TOKEN=""
EMAIL="test@example.com"
PASSWORD="Test123!"

echo "🧪 Testing ChatChout API endpoints"
echo "---------------------------------"

# Test registration
test_registration() {
  echo "📝 Testing registration..."
  
  RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test User","email":"'$EMAIL'","password":"'$PASSWORD'"}' \
    -w "\n%{http_code}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo "✅ Registration successful"
    # Extract token
    TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"token":"[^"]*"' | cut -d '"' -f 4)
    echo "   Token: ${TOKEN:0:20}..."
    return 0
  else
    echo "❌ Registration failed with status $HTTP_CODE"
    echo "$RESPONSE_BODY"
    return 1
  fi
}

# Test login
test_login() {
  echo "🔑 Testing login..."
  
  RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"'$EMAIL'","password":"'$PASSWORD'"}' \
    -w "\n%{http_code}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Login successful"
    # Extract token
    TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"token":"[^"]*"' | cut -d '"' -f 4)
    echo "   Token: ${TOKEN:0:20}..."
    return 0
  else
    echo "❌ Login failed with status $HTTP_CODE"
    echo "$RESPONSE_BODY"
    return 1
  fi
}

# Test authentication
test_auth() {
  echo "🔒 Testing authentication..."
  
  RESPONSE=$(curl -s -X GET "$BASE_URL/auth/test" \
    -H "Authorization: Bearer $TOKEN" \
    -w "\n%{http_code}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Authentication successful"
    return 0
  else
    echo "❌ Authentication failed with status $HTTP_CODE"
    echo "$RESPONSE_BODY"
    return 1
  fi
}

# Test user search
test_user_search() {
  echo "🔍 Testing user search..."
  
  RESPONSE=$(curl -s -X GET "$BASE_URL/users/search?q=test" \
    -H "Authorization: Bearer $TOKEN" \
    -w "\n%{http_code}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ User search successful"
    USER_COUNT=$(echo "$RESPONSE_BODY" | grep -o '"users":\[.*\]' | tr -cd '[' | wc -c)
    echo "   Found $USER_COUNT users"
    return 0
  else
    echo "❌ User search failed with status $HTTP_CODE"
    echo "$RESPONSE_BODY"
    return 1
  fi
}

# Test chats list
test_chats_list() {
  echo "💬 Testing chats list..."
  
  RESPONSE=$(curl -s -X GET "$BASE_URL/chats?page=1&limit=10" \
    -H "Authorization: Bearer $TOKEN" \
    -w "\n%{http_code}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Chats list successful"
    CHAT_COUNT=$(echo "$RESPONSE_BODY" | grep -o '"chats":\[.*\]' | tr -cd '[' | wc -c)
    echo "   Found $CHAT_COUNT chats"
    return 0
  else
    echo "❌ Chats list failed with status $HTTP_CODE"
    echo "$RESPONSE_BODY"
    return 1
  fi
}

# Test logout
test_logout() {
  echo "🚪 Testing logout..."
  
  RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
    -H "Authorization: Bearer $TOKEN" \
    -w "\n%{http_code}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Logout successful"
    return 0
  else
    echo "❌ Logout failed with status $HTTP_CODE"
    echo "$RESPONSE_BODY"
    return 1
  fi
}

# Run tests
echo "Starting tests..."
echo "---------------------------------"

# First try login, if that fails try registration
if ! test_login; then
  echo "Login failed, trying registration..."
  test_registration
  if [ $? -ne 0 ]; then
    echo "❌ Authentication setup failed. Exiting."
    exit 1
  fi
fi

# Test other endpoints
test_auth
test_user_search
test_chats_list
test_logout

echo "---------------------------------"
echo "✅ All tests completed"
