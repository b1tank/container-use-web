<div align="center">
  <img src="frontend/public/logo.svg" alt="cuui logo" width="180">
</div>

<br/>
<p align="center">
  <a href="https://npmjs.com/package/cuui"><img src="https://img.shields.io/npm/v/cuui.svg" alt="npm package"></a>
  <a href="https://nodejs.org/en/about/previous-releases"><img src="https://img.shields.io/node/v/cuui.svg" alt="node compatibility"></a>
  <a href="https://github.com/b1tank/container-use-ui/actions/workflows/ci.yml"><img src="https://github.com/b1tank/container-use-ui/actions/workflows/ci.yml/badge.svg?branch=main" alt="build status"></a>
</p>
<br/>

# Container Use UI CLI

A CLI tool (`cuui`) for running a local web UI for monitoring and managing Container Use environments.

## Installation

### Global Installation

```bash
npm install -g cuui
```

### Development Installation

**Prerequisites:** Make sure you have [pnpm](https://pnpm.io/) installed:
```bash
npm install -g pnpm
```

**Build and link:**
```bash
git clone <repository-url>
cd container-use-ui
./scripts/build.sh --dev
```

> The build script will automatically install all dependencies and build the CLI, frontend, and backend.

## Usage

The `cuui` command starts a local web UI for monitoring and managing Container Use environments.

```bash
# Basic usage with defaults
cuui

# Specify working directory and port
cuui --dir ~/my-project --port 3000

# Use a specific container-use binary
cuui --bin /usr/local/bin/container-use --dir ~/hello
```

### Command Options

- `-h, --host <HOST>` - Host to listen on (default: `localhost`)
- `-p, --port <PORT>` - Port to listen on (default: `8000`)
- `-d, --dir <DIR>` - Working directory (default: `.` - current directory)
- `-b, --bin <BINARY>` - Path to the container-use binary (default: `container-use`)
- `-v, --version` - Show version information
- `--help` - Show help message

### Path Resolution

The CLI properly handles path resolution:
- `.` resolves to the current working directory
- `~` resolves to the user's home directory
- `~/path` resolves to a path relative to the user's home directory
- Absolute paths are used as-is

### Examples

```bash
# Start from current directory
cuui

# Start from home directory
cuui --dir ~

# Start from a specific directory
cuui --dir ~/projects/my-app

# Start on different port and host
cuui --host 0.0.0.0 --port 8080

# Use specific container-use binary
cuui --bin ./my-container-use --dir .
```

The UI will automatically open in your browser with the specified working directory and binary path configured.

## Features

- 🚀 **Container Management** - Easy container development workflow
- 🌐 **Web UI** - Integrated dashboard accessible via browser
- 📁 **File Management** - Browse and edit files in your workspace
- ⚡ **Terminal Access** - Built-in terminal for command execution
- 🔄 **Git Integration** - Git operations and diff viewing
- 📊 **Environment Monitoring** - Track your development environments

## Development

### Project Structure

```
container-use-ui/
├── bin/              # CLI entry point
├── cli/              # CLI source code
│   └── src/          # CLI TypeScript source
├── backend/          # Hono API server
├── frontend/         # React UI
└── scripts/          # Build and utility scripts
```

### Building from Source

```bash
# Clone the repository
git clone <repository-url>
cd container-use-ui

# Install dependencies and build
./scripts/build.sh

# Link for local development
npm link
```

### Development Mode

```bash
# Run both frontend and backend in development mode
pnpm run dev
```

## License

MIT
