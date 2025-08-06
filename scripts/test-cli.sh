#!/usr/bin/env bash

set -e

echo "🧪 Testing Container Use UI CLI packaging..."

# Test the CLI is accessible
echo "📋 Testing CLI help..."
cuu --help

echo ""
echo "📋 Testing version..."
cuu --version

echo ""
echo "✅ All CLI tests passed!"
echo "🚀 Ready to publish! You can:"
echo "   - npm publish (if you have npm publish access)"
echo "   - Create a GitHub release"
echo "   - Package as a standalone binary with pkg"
