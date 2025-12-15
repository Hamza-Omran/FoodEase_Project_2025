#!/bin/bash

# Quick deployment helper script
# Run this after updating Vercel environment variables

echo "🚀 FoodEase Backend Deployment Helper"
echo "======================================"
echo ""

# Check if changes are committed
if [[ -n $(git status -s) ]]; then
    echo "📝 Uncommitted changes detected."
    echo ""
    read -p "Commit message (or press Enter for default): " commit_msg
    
    if [ -z "$commit_msg" ]; then
        commit_msg="Add PostgreSQL/Supabase database support"
    fi
    
    echo "Adding all changes..."
    git add .
    
    echo "Committing..."
    git commit -m "$commit_msg"
    
    echo "✅ Changes committed!"
else
    echo "✅ No uncommitted changes."
fi

echo ""
read -p "Push to GitHub and trigger Vercel deployment? (y/n): " push_confirm

if [ "$push_confirm" = "y" ] || [ "$push_confirm" = "Y" ]; then
    echo ""
    echo "📤 Pushing to GitHub..."
    git push main:v2
    
    echo ""
    echo "✅ Code pushed! Vercel will auto-deploy."
    echo ""
    echo "Next steps:"
    echo "1. Go to Vercel dashboard"
    echo "2. Watch deployment progress"
    echo "3. Test endpoints once deployed"
else
    echo ""
    echo "⏸️  Deployment cancelled. Run this script again when ready."
fi
