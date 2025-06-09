#!/bin/bash
set -e

echo "🚀 Starting OdontoTravel build process..."

# Backend setup
echo "📦 Setting up backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Frontend setup and build
echo "🎨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Build process completed successfully!"
echo "Backend: ready for deployment"
echo "Frontend: built in frontend/dist/" 