#!/bin/bash

# Quick GitHub Push Script
# Run this AFTER creating the repository on GitHub

set -e

echo "🚀 Pushing clinic-notector-web to GitHub..."
echo ""
echo "Repository: https://github.com/faradice/clinic-notector-web"
echo ""

# Check if remote exists
if git remote get-url origin &>/dev/null; then
    echo "✅ Remote 'origin' already configured"
else
    echo "📍 Adding remote..."
    git remote add origin git@github.com:faradice/clinic-notector-web.git
fi

echo ""
echo "📤 Pushing commits..."
git push -u origin main

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "🌐 View your repository at:"
echo "   https://github.com/faradice/clinic-notector-web"
echo ""
echo "📊 Commits pushed:"
git log --oneline -4
