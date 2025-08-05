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

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    pnpm install
    cd ..
fi

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    pnpm install
    cd ..
fi

# Build CLI first
echo "🔧 Building CLI..."
pnpm exec tsc -p tsconfig.cli.json

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

# Make CLI executable
chmod +x bin/cli.js

# Link for development if --dev flag is provided
if [ "$DEV_MODE" = true ]; then
    echo "🔗 Linking for development..."
    npm link
fi

echo "✅ Build completed successfully!"
if [ "$DEV_MODE" = true ]; then
    echo "💡 CLI has been linked for development and is ready to use globally"
else
    echo "💡 You can now install globally with: npm install -g ."
    echo "💡 Or link for development: npm link"
    echo "💡 Or build with dev linking: ./scripts/build.sh --dev|-d"
fi
