#!/bin/bash

# SaaSient Dashboard - Quick Deployment Script
# This script helps you deploy to Hostinger

echo "🚀 SaaSient Dashboard Deployment"
echo "================================="
echo ""

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo "⚠️  You have uncommitted changes. Committing them now..."
    git add -A
    read -p "Enter commit message: " commit_msg
    git commit -m "$commit_msg"
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Log in to your Hostinger control panel"
    echo "2. Go to Git section and pull the latest changes"
    echo "   OR"
    echo "   SSH into your server and run:"
    echo "   cd public_html && git pull && npm install && npm run build && pm2 restart all"
    echo ""
    echo "📖 Full deployment guide: HOSTINGER_DEPLOYMENT_GUIDE.md"
    echo ""
    echo "🔗 Repository: https://github.com/sysopsparadise/SaaSient-Dashboard.git"
else
    echo "❌ Failed to push to GitHub"
    exit 1
fi
