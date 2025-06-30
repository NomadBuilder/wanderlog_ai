#!/bin/bash

# WanderLog AI Deployment Script
# This script automates the Git workflow for easy deployment

echo "🚀 WanderLog AI Deployment Script"
echo "=================================="

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

# Check if we're in a Git repository
if [ ! -d ".git" ]; then
    print_error "Not in a Git repository. Please run this script from the project root."
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_status "Found uncommitted changes. Staging all files..."
    git add .
    
    # Prompt for commit message
    echo ""
    echo "📝 Enter a commit message (or press Enter for default):"
    echo "   Default: 'Update WanderLog AI - $(date +%Y-%m-%d)'"
    read -p "   Commit message: " COMMIT_MESSAGE
    
    # Use default message if none provided
    if [ -z "$COMMIT_MESSAGE" ]; then
        COMMIT_MESSAGE="Update WanderLog AI - $(date +%Y-%m-%d)"
    fi
    
    print_status "Committing changes with message: '$COMMIT_MESSAGE'"
    git commit -m "$COMMIT_MESSAGE"
    
    if [ $? -eq 0 ]; then
        print_success "Changes committed successfully!"
    else
        print_error "Failed to commit changes."
        exit 1
    fi
else
    print_warning "No uncommitted changes found."
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    print_error "No remote origin found. Please set up your GitHub repository first."
    exit 1
fi

# Get remote URL
REMOTE_URL=$(git remote get-url origin)
print_status "Remote repository: $REMOTE_URL"

# Push to remote
print_status "Pushing to GitHub..."
git push origin $CURRENT_BRANCH

if [ $? -eq 0 ]; then
    print_success "✅ Successfully deployed to GitHub!"
    echo ""
    echo "🌐 Your repository is available at:"
    echo "   https://github.com/NomadBuilder/wanderlog_ai"
    echo ""
    echo "📊 Deployment Summary:"
    echo "   - Branch: $CURRENT_BRANCH"
    echo "   - Remote: $REMOTE_URL"
    echo "   - Status: Deployed successfully"
else
    print_error "Failed to push to GitHub. Please check your connection and try again."
    exit 1
fi

echo ""
print_status "Deployment complete! 🎉" 