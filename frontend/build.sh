#!/bin/bash
set -e

echo "🧹 Cleaning previous builds..."
rm -rf node_modules package-lock.json pnpm-lock.yaml yarn.lock
rm -rf dist .vite

echo "📦 Installing dependencies with npm..."
npm install --legacy-peer-deps

echo "🏗️ Building frontend..."
npm run build

echo "✅ Frontend build completed successfully!"
echo "📂 Build output is in 'dist' directory" 