# MultiChrome - Chrome Multi-Environment Manager

<div align="center">


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg)](https://github.com/jiffies/multichrome)
[![GitHub release](https://img.shields.io/github/release/jiffies/multichrome.svg)](https://github.com/jiffies/multichrome/releases)

A cross-platform Chrome multi-environment management tool built with Electron, allowing you to easily manage multiple completely isolated Chrome browser environments.

English | [简体中文](README.md)

</div>

## ✨ Features

- 🌍 **Cross-Platform** - Full support for Windows, macOS, and Linux
- 🔐 **Complete Isolation** - Each environment has independent cookies, extensions, bookmarks, and settings
- 🗂️ **Group Management** - Organize environments by project or purpose
- 🏷️ **Tag System** - Add custom tags to environments for easy filtering
- 🗑️ **Recycle Bin** - Accidentally deleted? No problem! Support environment restoration
- 🌐 **Proxy Support** - Configure independent proxy for each environment or use global proxy
- 💼 **Wallet Management** - Record wallet address associated with each environment
- ⚙️ **Flexible Configuration** - Customize data storage path, startup page, etc.
- 🎨 **Modern UI** - Beautiful interface based on GitHub Primer design system
- 📱 **Responsive Design** - Support various screen sizes, including ultrawide monitors

## 📸 Screenshots

<!-- Add application screenshots here -->

## 🚀 Quick Start

### Installation

#### Option 1: Download Pre-built Binaries (Recommended)

Download the installer for your system from the [Releases](https://github.com/jiffies/multichrome/releases) page:

- **Windows**: `MultiChrome-Setup-x.x.x.exe`
- **macOS**: `MultiChrome-x.x.x.dmg` or `MultiChrome-x.x.x-mac.zip`
- **Linux**: `MultiChrome-x.x.x.AppImage` or `multichrome_x.x.x_amd64.deb`

> **macOS Users Note**: The app is not notarized by Apple. To open it for the first time:
> 1. Right-click the app icon and select "Open"
> 2. Click "Open" in the dialog
>
> Or run in Terminal: `xattr -cr /Applications/MultiChrome.app`

#### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/jiffies/multichrome.git
cd multichrome

# Install dependencies
npm install

# Run in development mode
npm run dev

# Or build and package
npm run build
npm run package:win   # Windows
npm run package:mac   # macOS
npm run package:linux # Linux
```

### Prerequisites

- Google Chrome browser installed
- **Windows**: Windows 10 or higher
- **macOS**: macOS 10.15 (Catalina) or higher
- **Linux**: Distribution supporting AppImage or deb packages

## 📖 Usage Guide

### Create Environment

1. Click "Create New Environment" button
2. Fill in environment name and group
3. (Optional) Add notes, wallet address, tags, etc.
4. Click "Create"

### Launch Environment

Click the "Launch" button on an environment card to open an independent Chrome window. All data for this environment is completely isolated from other environments.

### Configure Proxy

**Global Proxy**: Configure global proxy in settings, all environments without independent proxy will use the global proxy.

**Environment Proxy**: Configure independent proxy in environment details, takes priority over global proxy.

Proxy format examples:
```
http://127.0.0.1:7890
socks5://127.0.0.1:1080
```

### Manage Environments

- **Edit**: Click environment card to view details and edit
- **Delete**: Deleted environments go to recycle bin and can be restored
- **Permanent Delete**: Permanently delete environments in recycle bin

## 🏗️ Technical Architecture

### Tech Stack

**Frontend**
- React 18 - UI Framework
- TypeScript - Type Safety
- Primer React - GitHub Design System
- Tailwind CSS - Styling Utility

**Backend (Electron)**
- Electron - Desktop Application Framework
- Better SQLite3 - Data Storage
- Electron Store - Configuration Management
- Electron Log - Logging System

**Build Tools**
- Vite - Frontend Build
- Electron Builder - Application Packaging
- ESLint - Code Linting

### Project Structure

```
multichrome/
├── electron/              # Electron Main Process
│   ├── main.ts           # Application Entry
│   ├── chromeManager.ts  # Chrome Environment Management
│   ├── settingsManager.ts # Settings Management
│   └── cdpManager.ts     # Chrome DevTools Protocol
├── src/                  # React Renderer Process
│   ├── components/       # UI Components
│   ├── contexts/         # React Context
│   ├── types/           # TypeScript Types
│   └── App.tsx          # Application Root Component
├── assets/              # Static Resources
└── .github/             # GitHub Configuration
```

### Cross-Platform Implementation

- **Process Management**: Windows uses PowerShell + WMI, macOS/Linux use ps command
- **Path Handling**: Use Node.js path module to ensure cross-platform compatibility
- **Chrome Detection**: Auto-detect standard installation paths for different platforms

## 🔧 Development

### Development Requirements

- Node.js 18+
- npm 8+
- Git

### Development Commands

```bash
# Start development server (with hot reload)
npm run dev

# Start frontend only
npm run dev:vite

# Start Electron only
npm run dev:electron

# Code linting
npm run lint
npm run lint:fix

# Build
npm run build
npm run build:vite      # Build frontend only
npm run build:electron  # Build Electron only

# Package
npm run package:win     # Windows
npm run package:mac     # macOS
npm run package:linux   # Linux
```

### Contributing

We welcome all forms of contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

**Contribution Process:**
1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: add some feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `style`: Code formatting
- `refactor`: Refactoring
- `test`: Testing
- `chore`: Build/tooling

## 🐛 Bug Reports

If you encounter issues, please report them in [Issues](https://github.com/jiffies/multichrome/issues) and provide:

- Operating system and version
- MultiChrome version
- Chrome version
- Detailed reproduction steps
- Log files (located at `%APPDATA%/multichrome/logs`)

## 📝 Roadmap

- [ ] Environment import/export functionality
- [ ] Environment cloning
- [ ] Batch operations support
- [ ] Environment usage statistics
- [ ] Auto-update functionality
- [ ] Multi-language support (i18n)
- [ ] Environment backup and sync

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Electron](https://www.electronjs.org/) - Cross-platform desktop application framework
- [React](https://react.dev/) - User interface library
- [Primer React](https://primer.style/react/) - GitHub design system
- [Better SQLite3](https://github.com/WiseLibs/better-sqlite3) - SQLite bindings

## 📞 Contact

- Project Homepage: [https://github.com/jiffies/multichrome](https://github.com/jiffies/multichrome)
- Issue Tracker: [https://github.com/jiffies/multichrome/issues](https://github.com/jiffies/multichrome/issues)

---

<div align="center">

**If this project helps you, please give us a ⭐️!**

Made with ❤️ by MultiChrome Contributors

</div>
