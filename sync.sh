#!/usr/bin/env bash
set -e

cd /c/xampp/htdocs/PHARMA-FLOW

# Stage all changes
git add .

# Check if there are staged changes
if git diff --cached --quiet; then
  echo "No new changes to commit."
  exit 0
fi

MSG="${1:-Update PharmaFlow: $(date '+%Y-%m-%d %H:%M:%S')}"

git commit -m "$MSG"
git push -u origin main

echo "Pushed to origin/main successfully!"