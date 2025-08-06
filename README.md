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

# <img src="frontend/public/logo.svg" alt="cuui" width="22" style="display: inline; margin-right: 8px;">Container Use UI (`cuui`)

> A CLI tool (`cuui`) for running a local web UI for monitoring and managing [Container Use](https://container-use.com) environments.

- 🌐 **Web UI**
- 🚀 **Container Use Environment Monitoring**
- 🔄 **Git Integration**
- 📁 **File Explorer**
- ⚡ **Terminal Access**
- 📊 **Log/Diff Monitoring**

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
git clone https://github.com/b1tank/container-use-ui.git
cd container-use-ui

./scripts/build.sh
npm link
```

> The build script will automatically install all dependencies and build the CLI, frontend, and backend.

## Usage

### Command Options

- `-h, --host <HOST>`  - Host to listen on (default: `localhost`)
- `-p, --port <PORT>`  - Port to listen on (default: `8000`)
- `-d, --dir <DIR>`    - Working directory (default: `.` - current directory)
- `-b, --bin <BINARY>` - Path to the container-use binary (default: `container-use`)
- `-n, --no-open`      - Do not automatically open the browser (browser opened by default)
- `-V, --version`      - Show version information
- `-H, --help`         - Show help message

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

## Contributing

### Project Structure

```
container-use-ui/
├── src/              # CLI source code
├── backend/          # Hono API server
├── frontend/         # React UI
└── scripts/          # Build and utility scripts
```

## License

[MIT](https://github.com/b1tank/container-use-ui/blob/main/LICENSE)
