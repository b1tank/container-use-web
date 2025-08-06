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

# Parse command line arguments
DRY_RUN=false
SKIP_CHECKS=false
TAG=""
VERSION_BUMP=""

for arg in "$@"; do
    case $arg in
        --dry-run|-d)
            DRY_RUN=true
            shift
            ;;
        --skip-checks|-s)
            SKIP_CHECKS=true
            shift
            ;;
        --tag=*)
            TAG="${arg#*=}"
            shift
            ;;
        --bump=*)
            VERSION_BUMP="${arg#*=}"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run, -d     Perform a dry run without actually publishing"
            echo "  --skip-checks, -s Skip pre-publish checks"
            echo "  --tag=TAG         Publish with specific npm tag (e.g., beta, alpha)"
            echo "  --bump=TYPE       Auto-bump version (patch, minor, major)"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                # Normal publish"
            echo "  $0 --dry-run      # Test publish without actually publishing"
            echo "  $0 --bump=patch   # Auto-bump patch version and publish"
            echo "  $0 --tag=beta     # Publish as beta version"
            exit 0
            ;;
        *)
            log_error "Unknown option: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🚀 Publishing Container Use UI to npm"
echo "======================================"
echo ""

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")

# Auto-bump version if requested
if [ ! -z "$VERSION_BUMP" ]; then
    log_info "Auto-bumping version ($VERSION_BUMP)..."
    npm version "$VERSION_BUMP" --no-git-tag-version
    NEW_VERSION=$(node -p "require('./package.json').version")
    log_success "Version bumped from $CURRENT_VERSION to $NEW_VERSION"
    CURRENT_VERSION=$NEW_VERSION
fi

# Run pre-publish checks unless skipped
if [ "$SKIP_CHECKS" = false ]; then
    log_info "Running pre-publish checks..."
    ./scripts/pre-publish.sh
else
    log_warning "Skipping pre-publish checks"
fi

# Build the package
log_info "Building package..."
pnpm run build

# Create git commit and tag (if not dry run)
if [ "$DRY_RUN" = false ]; then
    log_info "Creating git commit and tag..."

    # Check if there are changes to commit
    if ! git diff-index --quiet HEAD --; then
        git add .
        git commit -m "Release v$CURRENT_VERSION"
        log_success "Created commit for release"
    else
        log_info "No changes to commit"
    fi

    # Create and push tag
    if ! git tag | grep -q "v$CURRENT_VERSION"; then
        git tag "v$CURRENT_VERSION"
        log_success "Created git tag: v$CURRENT_VERSION"

        # Push changes and tags
        log_info "Pushing to git..."
        git push origin $(git branch --show-current)
        git push origin --tags
        log_success "Pushed changes and tags to git"
    else
        log_warning "Git tag v$CURRENT_VERSION already exists"
    fi
fi

# Prepare npm publish command
PUBLISH_CMD="npm publish"

if [ "$DRY_RUN" = true ]; then
    PUBLISH_CMD="$PUBLISH_CMD --dry-run"
    log_info "Running npm publish dry run..."
else
    log_info "Publishing to npm..."
fi

if [ ! -z "$TAG" ]; then
    PUBLISH_CMD="$PUBLISH_CMD --tag $TAG"
    log_info "Publishing with tag: $TAG"
fi

# Execute publish command
$PUBLISH_CMD

if [ "$DRY_RUN" = true ]; then
    log_success "Dry run completed successfully!"
    echo ""
    echo "📋 What would happen in a real publish:"
    echo "   • Package would be published as container-use-ui@$CURRENT_VERSION"
    if [ ! -z "$TAG" ]; then
        echo "   • Would be tagged as: $TAG"
        echo "   • Install with: npm install -g container-use-ui@$TAG"
    else
        echo "   • Would be tagged as: latest"
        echo "   • Install with: npm install -g container-use-ui"
    fi
    echo ""
    echo "🚀 To publish for real, run: $0 (without --dry-run)"
else
    log_success "Package published successfully!"
    echo ""
    echo "🎉 container-use-ui@$CURRENT_VERSION is now available on npm!"
    echo ""
    echo "📦 Installation:"
    if [ ! -z "$TAG" ]; then
        echo "   npm install -g container-use-ui@$TAG"
    else
        echo "   npm install -g container-use-ui"
    fi
    echo ""
    echo "🔗 Links:"
    echo "   • npm: https://www.npmjs.com/package/container-use-ui"
    echo "   • GitHub: https://github.com/b1tank/container-use-ui"
    echo ""
    echo "📋 Post-publish tasks:"
    echo "   • Update documentation if needed"
    echo "   • Announce the release"
    echo "   • Monitor for issues"

    # Verify publication
    log_info "Verifying publication..."
    sleep 5  # Wait for npm registry to update
    if npm view "container-use-ui@$CURRENT_VERSION" version &> /dev/null; then
        log_success "Package verified on npm registry"
    else
        log_warning "Package not yet visible on registry (may take a few minutes)"
    fi
fi
