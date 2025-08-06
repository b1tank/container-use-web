#!/usr/bin/env bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_item() {
    echo -n "   "
    if [ $1 -eq 0 ]; then
        log_success "$2"
    else
        log_error "$2"
    fi
}

echo "🚀 Pre-publish checklist for Container Use UI"
echo "=============================================="
echo ""

FAILED_CHECKS=0

# 1. Check git status
log_info "Checking git status..."
if git diff-index --quiet HEAD --; then
    check_item 0 "Working directory is clean"
else
    check_item 1 "Working directory has uncommitted changes"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# 2. Check if on main branch
CURRENT_BRANCH=$(git branch --show-current)
log_info "Checking git branch..."
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    check_item 0 "On main branch ($CURRENT_BRANCH)"
else
    check_item 1 "Not on main branch (currently on: $CURRENT_BRANCH)"
    log_warning "Consider switching to main branch for releases"
fi

# 3. Check npm login
log_info "Checking npm authentication..."
if npm whoami &> /dev/null; then
    NPM_USER=$(npm whoami)
    check_item 0 "Logged into npm as: $NPM_USER"
else
    check_item 1 "Not logged into npm"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    echo "   Run: npm login"
fi

# 4. Check package.json version
log_info "Checking package version..."
PACKAGE_VERSION=$(node -p "require('./package.json').version")
if git tag | grep -q "v$PACKAGE_VERSION"; then
    check_item 1 "Version v$PACKAGE_VERSION already exists as git tag"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    echo "   Consider bumping version: npm version patch|minor|major"
else
    check_item 0 "Version v$PACKAGE_VERSION is new"
fi

# 5. Check if npm package exists
log_info "Checking npm registry..."
if npm view "cuu@$PACKAGE_VERSION" &> /dev/null; then
    check_item 1 "Version v$PACKAGE_VERSION already published to npm"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    check_item 0 "Version v$PACKAGE_VERSION not yet published"
fi

# 6. Run tests
log_info "Running package tests..."
if ./scripts/test-package.sh --skip-build &> /dev/null; then
    check_item 0 "Package tests passed"
else
    check_item 1 "Package tests failed"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    echo "   Run: pnpm run test:package for details"
fi

# 7. Check build artifacts exist
log_info "Checking build artifacts..."
BUILD_MISSING=0

if [ ! -d "frontend/dist" ]; then
    log_error "   Frontend build missing (frontend/dist)"
    BUILD_MISSING=1
fi

if [ ! -d "backend/dist" ]; then
    log_error "   Backend build missing (backend/dist)"
    BUILD_MISSING=1
fi

if [ ! -f "bin/cli.js" ]; then
    log_error "   CLI build missing (bin/cli.js)"
    BUILD_MISSING=1
fi

if [ $BUILD_MISSING -eq 0 ]; then
    check_item 0 "All build artifacts present"
else
    check_item 1 "Missing build artifacts"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    echo "   Run: pnpm run build"
fi

# 8. Check package size
log_info "Checking package size..."
TARBALL=$(npm pack)
PACKAGE_SIZE_BYTES=$(stat -c%s "$TARBALL" 2>/dev/null || stat -f%z "$TARBALL" 2>/dev/null)
PACKAGE_SIZE_MB=$((PACKAGE_SIZE_BYTES / 1024 / 1024))
rm "$TARBALL"

if [ $PACKAGE_SIZE_MB -gt 10 ]; then
    check_item 1 "Package size is large (${PACKAGE_SIZE_MB}MB)"
    log_warning "Consider optimizing package size"
else
    check_item 0 "Package size is reasonable (${PACKAGE_SIZE_MB}MB)"
fi

# 9. Check required files
log_info "Checking required files..."
REQUIRED_FILES=("README.md" "LICENSE" "package.json")
MISSING_FILES=0

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        log_error "   Missing required file: $file"
        MISSING_FILES=1
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    check_item 0 "All required files present"
else
    check_item 1 "Missing required files"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

echo ""
echo "=============================================="

if [ $FAILED_CHECKS -eq 0 ]; then
    log_success "🎉 All checks passed! Ready to publish."
    echo ""
    echo "📋 Next steps:"
    echo "   1. git add . && git commit -m 'Release v$PACKAGE_VERSION'"
    echo "   2. git tag v$PACKAGE_VERSION"
    echo "   3. git push origin main --tags"
    echo "   4. npm publish"
    echo ""
    echo "💡 Or run the automated publish command:"
    echo "   ./scripts/publish.sh"
else
    log_error "❌ $FAILED_CHECKS check(s) failed. Please fix issues before publishing."
    echo ""
    echo "🔧 Common fixes:"
    echo "   • Commit changes: git add . && git commit -m 'Your message'"
    echo "   • Login to npm: npm login"
    echo "   • Bump version: npm version patch"
    echo "   • Build package: pnpm run build"
    echo "   • Run tests: pnpm run test:package"
    exit 1
fi
