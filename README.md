# Container Use UI CLI

A CLI tool for container development with an integrated UI dashboard.

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

### Start the UI Dashboard

```bash
# Start with default settings (port 8000)
container-use-ui start

# Or use the short alias
cui start

# Start on a different port
container-use-ui start --port 3000

# Start without opening browser
container-use-ui start --no-open

# Start on a different host
container-use-ui start --host 0.0.0.0 --port 8000
```

### Available Commands

- `container-use-ui start` - Start the UI dashboard server
- `container-use-ui version` - Show version information
- `cui` - Short alias for `container-use-ui`

### Options for `start` command

- `-p, --port <port>` - Port to run the server on (default: 8000)
- `--no-open` - Do not open browser automatically
- `-h, --host <host>` - Host to bind the server to (default: localhost)

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
