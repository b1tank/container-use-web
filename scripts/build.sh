#!/usr/bin/env bash

set -e

# Parse command line arguments
DEV_MODE=false
for arg in "$@"; do
    case $arg in
        --dev|-d)
            DEV_MODE=true
            shift
            ;;
        *)
            # Unknown option
            ;;
    esac
done

echo "🏗️  Building Container Use UI CLI..."

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
