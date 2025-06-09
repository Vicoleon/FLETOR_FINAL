#!/bin/bash
set -e

echo "🧹 Cleaning previous builds and dependencies..."
# Remove all node_modules directories (including nested ones)
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
# Remove ALL lock files (important for npm optional dependencies bug)
rm -rf package-lock.json pnpm-lock.yaml yarn.lock .pnpm-lock.yaml
# Remove build artifacts
rm -rf dist .vite .cache
# Remove any pnpm-specific directories
rm -rf .pnpm .pnpm-store
# Remove npm cache to ensure clean state
npm cache clean --force 2>/dev/null || true

echo "🔍 Verifying Node.js version..."
node --version
npm --version

echo "📦 Installing dependencies with npm (clean install for Rollup fix)..."
# First install to create package-lock.json
npm install --legacy-peer-deps --no-save --prefer-offline || npm install --legacy-peer-deps

echo "🔧 Fixing Rollup native dependencies..."
# Remove node_modules and package-lock.json again (npm bug workaround)
rm -rf node_modules package-lock.json
# Clean reinstall to fix optional dependencies issue
npm install --legacy-peer-deps

echo "🏗️ Building frontend..."
npm run build

echo "✅ Frontend build completed successfully!"
echo "📂 Build output is in 'dist' directory"
echo "📋 Build contents:"
ls -la dist/ || echo "No dist directory found" 