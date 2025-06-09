#!/bin/bash
set -e

echo "🧹 Cleaning previous builds and dependencies..."
# Remove all node_modules directories (including nested ones)
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
# Remove all lock files
rm -rf package-lock.json pnpm-lock.yaml yarn.lock
# Remove build artifacts
rm -rf dist .vite .cache
# Remove any pnpm-specific directories
rm -rf .pnpm .pnpm-store

echo "🔍 Verifying Node.js version..."
node --version
npm --version

echo "📦 Installing dependencies with npm (clean install)..."
npm ci --legacy-peer-deps --no-optional || npm install --legacy-peer-deps --no-optional

echo "🏗️ Building frontend..."
npm run build

echo "✅ Frontend build completed successfully!"
echo "📂 Build output is in 'dist' directory"
echo "📋 Build contents:"
ls -la dist/ || echo "No dist directory found" 