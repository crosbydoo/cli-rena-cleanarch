# create-rena-cleanarch

[![npm version](https://img.shields.io/npm/v/cli-rena-cleanarch.svg)](https://www.npmjs.com/package/cli-rena-cleanarch)
[![npm downloads](https://img.shields.io/npm/dm/cli-rena-cleanarch.svg)](https://www.npmjs.com/package/cli-rena-cleanarch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A CLI tool to scaffold new React Native projects using the clean architecture template from [crosbydoo/rena-cleanarch](https://github.com/crosbydoo/rena-cleanarch).

## Installation

### Quick Start (Recommended)

Use `npx` to run the CLI without installing it globally:

```bash
npx create-rena-cleanarch <project-name>
```

### Global Installation

Install it globally via npm:

```bash
npm install -g cli-rena-cleanarch
```

Then use it as:

```bash
create-rena-cleanarch <project-name>
```

### Local Installation

You can also install it as a dev dependency in your project:

```bash
npm install --save-dev cli-rena-cleanarch
```

## Usage

### Basic Usage

Create a new project:

```bash
npx create-rena-cleanarch my-app
```

This will:
1. Download the latest template from the rena-cleanarch repository
2. Extract and copy files to your project directory
3. Patch project metadata (package.json, app.json)
4. Install dependencies automatically

### Skip Installation

To create the project without installing dependencies:

```bash
npx create-rena-cleanarch my-app --no-install
```

### Specify Package Manager

You can explicitly choose which package manager to use:

```bash
# Use npm
npx create-rena-cleanarch my-app --package-manager npm

# Use yarn
npx create-rena-cleanarch my-app --package-manager yarn

# Use pnpm
npx create-rena-cleanarch my-app --package-manager pnpm

# Short form
npx create-rena-cleanarch my-app --pm yarn
```

**Note:** If you don't specify a package manager, the CLI will auto-detect (yarn if available, otherwise npm).

### Help

View usage information:

```bash
npx create-rena-cleanarch --help
# or
npx create-rena-cleanarch -h
```

## Requirements

- Node.js >= 18.0.0
- npm (required), yarn or pnpm (optional, for dependency installation)

## Features

- 🚀 Quick project scaffolding from a clean architecture template
- 📦 Automatic dependency installation with package manager selection
- 🎯 Automatic project name patching in package.json and app.json
- 🧹 Removes template's git history for a fresh start
- 🔄 Handles redirects when downloading the template
- ⚙️ Support for npm, yarn, and pnpm with auto-detection or manual selection

## How It Works

1. **Download**: Fetches the latest template tarball from GitHub
2. **Extract**: Extracts the template to a temporary directory
3. **Copy**: Copies all files to your target project directory
4. **Patch**: Updates project metadata (name, slug, etc.)
5. **Install**: Installs dependencies using your preferred package manager

## Package Manager

### Auto-Detection

By default, the CLI automatically detects and uses your preferred package manager in this order:
1. yarn (if installed)
2. npm (fallback)

### Manual Selection

You can explicitly specify which package manager to use with the `--package-manager` (or `--pm`) option:

- `npm` - Node Package Manager
- `yarn` - Yarn Package Manager
- `pnpm` - Performant Node Package Manager

The CLI will verify that the specified package manager is installed before attempting to use it.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [ristudev](https://github.com/ristudev)

## Related

- [rena-cleanarch](https://github.com/crosbydoo/rena-cleanarch) - The React Native clean architecture template

## NPM Package

📦 [View on npm](https://www.npmjs.com/package/cli-rena-cleanarch)
