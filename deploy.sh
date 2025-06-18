#!/bin/bash

echo "getting ready to deploy..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "need to set up git first:"
    echo "git init"
    echo "git add ."
    echo "git commit -m 'Initial commit'"
    echo "git remote add origin <your-repo-url>"
    exit 1
fi

# Check current branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "you're on $current_branch branch"
fi

# Add and commit changes
echo "adding files..."
git add .

echo "committing..."
git commit -m "Update deployment config"

echo "pushing to github..."
git push origin main

echo "all done! now deploy to render and vercel" 