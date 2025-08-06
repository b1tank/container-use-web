#!/usr/bin/env bash

set -e

echo "🏗️  Building Container Use UI CLI: cuui ..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    pnpm install
fi

# Build CLI first
echo "🔧 Building CLI..."
pnpm run build:cli

# Build frontend
echo "🎨 Building frontend..."
cd frontend
pnpm run build
cd ..

# Build backend
echo "⚙️  Building backend..."
cd backend
pnpm run build
cd ..
