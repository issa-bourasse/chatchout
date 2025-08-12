#!/bin/bash

# ChatChout Deployment Script
# This script helps deploy the application to Vercel (frontend) and Railway (backend)

echo "🚀 ChatChout Deployment Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install Node.js and npm."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed. Please install git."
        exit 1
    fi
    
    print_success "All dependencies are installed."
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install server dependencies
    cd server
    npm install
    cd ..
    
    # Install frontend dependencies
    cd chat-app
    npm install
    cd ..
    
    print_success "Dependencies installed successfully."
}

# Build frontend
build_frontend() {
    print_status "Building frontend for production..."
    
    cd chat-app
    npm run build
    cd ..
    
    print_success "Frontend built successfully."
}

# Deploy to Vercel
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    print_warning "Make sure you have:"
    print_warning "1. Vercel CLI installed (npm i -g vercel)"
    print_warning "2. Logged in to Vercel (vercel login)"
    print_warning "3. Set environment variables in Vercel dashboard"
    
    read -p "Continue with Vercel deployment? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd chat-app
        vercel --prod
        cd ..
        print_success "Frontend deployment initiated."
    else
        print_warning "Skipping frontend deployment."
    fi
}

# Deploy to Railway
deploy_backend() {
    print_status "Deploying backend to Railway..."
    print_warning "Make sure you have:"
    print_warning "1. Railway CLI installed (npm i -g @railway/cli)"
    print_warning "2. Logged in to Railway (railway login)"
    print_warning "3. Created a Railway project"
    print_warning "4. Set environment variables in Railway dashboard"
    
    read -p "Continue with Railway deployment? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd server
        railway up
        cd ..
        print_success "Backend deployment initiated."
    else
        print_warning "Skipping backend deployment."
    fi
}

# Main deployment flow
main() {
    echo
    print_status "Starting deployment process..."
    
    check_dependencies
    install_dependencies
    build_frontend
    
    echo
    print_status "Ready to deploy!"
    echo
    echo "Choose deployment option:"
    echo "1. Deploy frontend only (Vercel)"
    echo "2. Deploy backend only (Railway)"
    echo "3. Deploy both (Recommended)"
    echo "4. Exit"
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            deploy_frontend
            ;;
        2)
            deploy_backend
            ;;
        3)
            deploy_backend
            deploy_frontend
            ;;
        4)
            print_status "Deployment cancelled."
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
    
    echo
    print_success "Deployment process completed!"
    print_status "Don't forget to:"
    print_status "1. Update environment variables with actual URLs"
    print_status "2. Test the deployed application"
    print_status "3. Check logs for any issues"
}

# Run main function
main
