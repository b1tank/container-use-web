# Container Use UI CLI

A CLI tool (`cuu`) for running a local web UI for monitoring and managing Container Use environments.

## Installation

### Global Installation

```bash
npm install -g container-use-ui
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

The `cuu` command starts a local web UI for monitoring and managing Container Use environments.

```bash
# Basic usage with defaults
cuu

# Specify working directory and port
cuu --dir ~/my-project --port 3000

# Use a specific container-use binary
cuu --bin /usr/local/bin/container-use --dir ~/hello
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
cuu

# Start from home directory
cuu --dir ~

# Start from a specific directory
cuu --dir ~/projects/my-app

# Start on different port and host
cuu --host 0.0.0.0 --port 8080

# Use specific container-use binary
cuu --bin ./my-container-use --dir .
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
