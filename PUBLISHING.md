# NPM Publishing Guide

This guide covers how to test and publish the `container-use-ui` package to npm.

## Prerequisites

1. **npm Account**: Ensure you have an npm account and are logged in
   ```bash
   npm whoami  # Check if logged in
   npm login   # Login if needed
   ```

2. **Build Tools**: Ensure pnpm is installed
   ```bash
   npm install -g pnpm
   ```

## Testing Your Package

### 1. Quick Test (Recommended for regular development)

```bash
# Test the package with current build
pnpm run test:package
```

This will:
- ✅ Validate package.json
- ✅ Build the package
- ✅ Link and test CLI commands
- ✅ Run existing CLI tests
- ✅ Create and inspect npm pack tarball
- ✅ Run npm publish dry-run

### 2. Full Test (Recommended before major releases)

```bash
# Test with complete installation simulation
pnpm run test:package:full
```

This includes everything from quick test plus:
- ✅ Install package from tarball in temporary directory
- ✅ Test global installation
- ✅ Verify all commands work in clean environment

### 3. Manual Testing Steps

#### Test Local Installation
```bash
# Build and link locally
./scripts/build.sh --dev

# Test CLI commands
container-use-ui --help
cui --help
container-use-ui version
container-use-ui start --help
```

#### Test Package Contents
```bash
# Create package tarball
npm pack

# Inspect contents
tar -tzf container-use-ui-*.tgz

# Check size
ls -lh container-use-ui-*.tgz
```

#### Test Installation from Tarball
```bash
# Install globally from tarball
npm install -g ./container-use-ui-*.tgz

# Test installed package
container-use-ui --help
cui start --help

# Uninstall when done
npm uninstall -g container-use-ui
```

## Publishing Process

### 1. Pre-Publication Checklist

- [ ] All tests pass (`pnpm run test:package:full`)
- [ ] Version number updated in `package.json`
- [ ] CHANGELOG/README updated
- [ ] All changes committed to git
- [ ] Clean working directory (`git status`)

### 2. Version Management

```bash
# Update version (choose one)
npm version patch   # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0
npm version major   # 1.0.0 -> 2.0.0

# Or update manually in package.json
```

### 3. Git Tagging

```bash
# Commit all changes
git add .
git commit -m "Release v$(node -p 'require("./package.json").version')"

# Create and push tag
git tag "v$(node -p 'require("./package.json").version')"
git push origin main --tags
```

### 4. Publishing

#### Standard Publishing
```bash
# Final test
pnpm run test:package:full

# Publish to npm
npm publish
```

#### Beta/Alpha Publishing
```bash
# Publish with tag
npm publish --tag beta
npm publish --tag alpha

# Users install with: npm install -g container-use-ui@beta
```

#### Scoped Package Publishing
```bash
# If package is scoped (@username/package-name)
npm publish --access public
```

### 5. Post-Publication

```bash
# Verify publication
npm view container-use-ui

# Test installation
npm install -g container-use-ui@latest
container-use-ui --help
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   npm login
   npm whoami  # Verify login
   ```

2. **Package Name Conflicts**
   ```bash
   npm search container-use-ui  # Check if name exists
   ```

3. **Build Failures**
   ```bash
   pnpm run clean:build  # Clean build artifacts
   pnpm run build        # Rebuild
   ```

4. **File Inclusion Issues**
   - Check `files` field in `package.json`
   - Use `npm pack` to inspect included files
   - Add necessary files to `files` array

### Debugging Commands

```bash
# Check what will be published
npm publish --dry-run

# List all files to be included
npm pack --dry-run

# View current package info
npm view container-use-ui

# Check package size and files
npm pack && tar -tzf container-use-ui-*.tgz
```

### Testing in Different Environments

#### Docker Test
```bash
# Test in clean Docker environment
docker run -it --rm node:18-alpine sh
npm install -g container-use-ui
container-use-ui --help
```

#### CI/CD Test
Add to your CI pipeline:
```yaml
- name: Test Package
  run: |
    npm pack
    npm install -g ./container-use-ui-*.tgz
    container-use-ui --help
    cui --help
```

## Best Practices

1. **Always test before publishing**
   - Run `pnpm run test:package:full`
   - Test in clean environment

2. **Use semantic versioning**
   - MAJOR: Breaking changes
   - MINOR: New features (backward compatible)
   - PATCH: Bug fixes

3. **Keep package size small**
   - Use `.npmignore` or `files` field
   - Exclude dev dependencies from bundle

4. **Document changes**
   - Update README.md
   - Maintain CHANGELOG.md

5. **Test installation methods**
   - Global: `npm install -g`
   - Local: `npm install`
   - From tarball: `npm install ./package.tgz`

## Rollback if Needed

```bash
# Unpublish within 72 hours (use carefully)
npm unpublish container-use-ui@1.0.0

# Deprecate a version instead (preferred)
npm deprecate container-use-ui@1.0.0 "This version has critical bugs, please upgrade"
```
