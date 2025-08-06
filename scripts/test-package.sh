#!/usr/bin/env bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper fun# 8. Check file inclusions
log_info "Checking package file inclusions..."
TARBALL_FILES=$(tar -tzf "$TARBALL" 2>/dev/null | head -20)
echo "$TARBALL_FILES"
echo "..."
TOTAL_FILES=$(tar -tzf "$TARBALL" 2>/dev/null | wc -l)
log_info "Total files in package: $TOTAL_FILES"

# 9. Size check
PACKAGE_SIZE=$(ls -lh "$TARBALL" | awk '{print $5}')
log_info "Package size: $PACKAGE_SIZE"g_info() {
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

# Parse command line arguments
FULL_TEST=false
SKIP_BUILD=false
TEMP_DIR=""

for arg in "$@"; do
    case $arg in
        --full|-f)
            FULL_TEST=true
            shift
            ;;
        --skip-build|-s)
            SKIP_BUILD=true
            shift
            ;;
        *)
            # Unknown option
            ;;
    esac
done

echo "📦 Testing Container Use UI package for npm publishing..."
echo ""

# 1. Pre-flight checks
log_info "Running pre-flight checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Are you in the project root?"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    log_error "pnpm is not installed. Please install pnpm first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Check package.json for required fields
log_info "Validating package.json..."
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")
PACKAGE_MAIN=$(node -p "require('./package.json').bin || {}")

if [ "$PACKAGE_NAME" = "undefined" ]; then
    log_error "Package name is missing in package.json"
    exit 1
fi

if [ "$PACKAGE_VERSION" = "undefined" ]; then
    log_error "Package version is missing in package.json"
    exit 1
fi

log_success "Package validation passed: $PACKAGE_NAME@$PACKAGE_VERSION"

# 2. Build the package
if [ "$SKIP_BUILD" = false ]; then
    log_info "Building the package..."
    ./scripts/build.sh
    log_success "Build completed"
else
    log_warning "Skipping build step"
fi

# 3. Test local installation
log_info "Testing local installation..."

# Unlink if already linked
if npm list -g $PACKAGE_NAME &> /dev/null; then
    log_info "Unlinking previously linked package..."
    npm unlink -g $PACKAGE_NAME || true
fi

# Link the package
log_info "Linking package locally..."
npm link

# Test CLI availability
log_info "Testing CLI availability..."
if ! command -v container-use-ui &> /dev/null; then
    log_error "CLI not found after linking"
    exit 1
fi

if ! command -v cui &> /dev/null; then
    log_error "Short alias 'cui' not found after linking"
    exit 1
fi

log_success "CLI commands are available"

# 4. Run existing CLI tests
log_info "Running CLI tests..."
./scripts/test-cli.sh
log_success "CLI tests passed"

# 5. Create and test npm pack
log_info "Creating npm package tarball..."
TARBALL=$(npm pack)
log_success "Created tarball: $TARBALL"

if [ "$FULL_TEST" = true ]; then
    # 6. Full installation test in temporary directory
    log_info "Running full installation test..."

    TEMP_DIR=$(mktemp -d)
    log_info "Created temporary directory: $TEMP_DIR"

    cd "$TEMP_DIR"

    # Install from tarball
    log_info "Installing from tarball..."
    npm install -g "$OLDPWD/$TARBALL"

    # Test installation
    log_info "Testing installed package..."
    container-use-ui --help > /dev/null
    cui --help > /dev/null
    container-use-ui version > /dev/null

    log_success "Package installation test passed"

    # Cleanup
    cd "$OLDPWD"
    npm uninstall -g $PACKAGE_NAME
    rm -rf "$TEMP_DIR"
    log_info "Cleaned up temporary installation"
fi

# 7. Check file inclusions
log_info "Checking package file inclusions..."
tar -tzf "$TARBALL" | head -20
echo "..."
log_info "Total files in package: $(tar -tzf "$TARBALL" | wc -l)"

# 8. Size check
PACKAGE_SIZE=$(ls -lh "$TARBALL" | awk '{print $5}')
log_info "Package size: $PACKAGE_SIZE"

# 9. Registry check (dry run)
log_info "Running npm publish dry run..."
npm publish --dry-run

# Cleanup tarball
rm "$TARBALL"

echo ""
log_success "🎉 Package testing completed successfully!"
echo ""
echo "📋 Summary:"
echo "   Package: $PACKAGE_NAME@$PACKAGE_VERSION"
echo "   Size: $PACKAGE_SIZE"
echo "   CLI commands: container-use-ui, cui"
echo ""
echo "🚀 Ready for publishing!"
echo ""
echo "💡 Next steps:"
echo "   1. Review the dry-run output above"
echo "   2. Commit your changes: git add . && git commit -m 'Release v$PACKAGE_VERSION'"
echo "   3. Tag the release: git tag v$PACKAGE_VERSION"
echo "   4. Push changes: git push && git push --tags"
echo "   5. Publish to npm: npm publish"
echo ""
echo "🔧 Alternative publish methods:"
echo "   • Test with specific registry: npm publish --registry http://localhost:4873"
echo "   • Publish with tag: npm publish --tag beta"
echo "   • Publish scoped package: npm publish --access public"
