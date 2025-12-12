#!/bin/bash

# FoodEase Quick Deployment Script
# This script helps you prepare your project for Vercel deployment

echo "🚀 FoodEase Deployment Preparation"
echo "=================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

# Check for .gitignore files
echo ""
echo "📝 Checking for .gitignore files..."
if [ -f "backend/.gitignore" ] && [ -f "frontend/.gitignore" ]; then
    echo "✅ .gitignore files found"
else
    echo "⚠️  Warning: .gitignore files may be missing"
fi

# Check for Vercel configuration
echo ""
echo "🔧 Checking Vercel configuration..."
if [ -f "backend/vercel.json" ]; then
    echo "✅ Backend vercel.json found"
else
    echo "❌ Backend vercel.json missing"
fi

# Reminder about environment variables
echo ""
echo "⚙️  Environment Variables Checklist:"
echo "   Backend needs:"
echo "   - DB_HOST"
echo "   - DB_USER"
echo "   - DB_PASSWORD"
echo "   - DB_NAME"
echo "   - JWT_SECRET"
echo "   - FRONTEND_URL"
echo ""
echo "   Frontend needs:"
echo "   - VITE_API_URL"
echo ""

# Check if user wants to add and commit
echo "📋 Ready to commit changes?"
read -p "Do you want to add and commit all changes? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    git commit -m "Prepare for Vercel deployment"
    echo "✅ Changes committed"
fi

echo ""
echo "🎉 Preparation complete!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git remote add origin <your-repo-url> && git push -u origin main"
echo "2. Follow the DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
