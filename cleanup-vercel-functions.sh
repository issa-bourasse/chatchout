#!/bin/bash

# ChatChout Vercel Function Optimization Script
# This script helps clean up unused API files to stay within Vercel's function limits

echo "🧹 ChatChout Vercel Function Cleanup"
echo "---------------------------------"

# Check current API files
cd server
API_FILES=$(ls -1 api/*.js 2>/dev/null | wc -l)

echo "Found $API_FILES API files:"
# List consolidated files first
echo -e "\n✅ Consolidated handlers:"
ls -1 api/consolidated-*.js 2>/dev/null | sed 's/api\//  /'

# List utility files
echo -e "\n⚙️ Required utilities:"
ls -1 api/auth-middleware*.js api/allowCors.js 2>/dev/null | sed 's/api\//  /'

# List other API files
echo -e "\nℹ️ Other API files:"
ls -1 api/*.js 2>/dev/null | grep -v "consolidated-" | grep -v "auth-middleware" | grep -v "allowCors.js" | sed 's/api\//  /'

echo -e "\nVercel Hobby plan has a limit of 12 serverless functions."
echo "Your current setup uses the following consolidated handlers:"
echo "  - consolidated-api.js: Handles login, logout, user search, and chats list"
echo "  - consolidated-auth.js: Handles registration and auth testing"

read -p $'\nWould you like to archive unused API files to optimize your deployment? (y/n) ' CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Operation canceled."
    cd ..
    exit 1
fi

# Create archive folder if it doesn't exist
if [ ! -d "api/_archived" ]; then
    mkdir -p api/_archived
    echo "Created archive folder: api/_archived"
fi

# List of files that should be kept
FILES_TO_KEEP=("consolidated-api.js" "consolidated-auth.js" "auth-middleware-new.js" "auth-middleware.js" "allowCors.js" "cors-test.js")

# Move unused files to archive
MOVED_COUNT=0
for file in api/*.js; do
    filename=$(basename "$file")
    
    # Check if the file should be kept
    KEEP=false
    for keep_file in "${FILES_TO_KEEP[@]}"; do
        if [ "$filename" == "$keep_file" ]; then
            KEEP=true
            break
        fi
    done
    
    # Move file if it shouldn't be kept
    if [ "$KEEP" == "false" ]; then
        mv "$file" "api/_archived/$filename"
        echo "Archived: $filename"
        MOVED_COUNT=$((MOVED_COUNT+1))
    fi
done

echo -e "\n✅ Operation completed! Archived $MOVED_COUNT files."
echo "Files have been moved to api/_archived folder and won't be deployed."
echo "You can restore them later if needed."

# Check remaining files
REMAINING_FILES=$(ls -1 api/*.js 2>/dev/null | wc -l)
echo -e "\nRemaining $REMAINING_FILES API files:"
ls -1 api/*.js 2>/dev/null | sed 's/api\//  - /'

echo -e "\nYou should now be able to deploy to Vercel within the function limit."
cd ..
