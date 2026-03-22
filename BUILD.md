# Building Study CCTV Desktop

This Electron application is configured to build installers for Windows and Linux using electron-builder.

## Prerequisites

Ensure you have Node.js and npm installed:
```bash
node --version
npm --version
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Verify the build configuration is correct:
```bash
npm run check
```

## Build Commands

### Development Mode
Start the application in development mode:
```bash
npm start
```

### Package Check
Check syntax of all code files:
```bash
npm run check
```

### Build Distribution Packages
Create distributable packages for your system:
```bash
npm run build
```

This will create:
- **Windows**: NSIS installer (.exe) and portable executable in `dist/` directory
- **Linux**: AppImage and .deb packages in `dist/` directory

### Pack (Test Build)
Create a test build without code signing:
```bash
npm run pack
```

## Build Configuration

The build settings are defined in `package.json` under the `"build"` section:

- **Windows Targets**:
  - NSIS Installer (standard installation experience)
  - Portable Executable (no installation required)

- **Linux Targets**:
  - AppImage (universal executable)
  - DEB package (Debian/Ubuntu installer)

## Build Output

Built packages are placed in the `dist/` directory:
```
dist/
  ├── Study CCTV-1.0.0.exe          (NSIS Installer)
  ├── Study CCTV-1.0.0 Setup.exe    (Portable)
  ├── Study CCTV-1.0.0.AppImage     (Linux)
  └── Study CCTV_1.0.0_amd64.deb    (Debian package)
```

## Troubleshooting

### Build fails with "electron-builder not found"
Ensure `node_modules` is up to date:
```bash
npm install electron-builder --save-dev
```

### Platform-specific builds
The current configuration builds for the platform you're on. To build for other platforms, install the appropriate tools:

- **For Windows NSIS**: Wine on Linux/Mac
- **For macOS**: Only available on macOS
- **For Linux**: Use wine or cross-compile tools

## Version Management

To update the build version, edit `package.json`:
```json
{
  "version": "1.0.0"  // Change this value
}
```

## Next Steps

1. Install dependencies: `npm install`
2. Check syntax: `npm run check`
3. Build packages: `npm run build`

The built installers will be ready for distribution in the `dist/` folder.
