# Study CCTV Desktop (Electron)

Desktop timelapse recorder built from scratch for Windows and Linux.

## Features

- Live webcam preview
- Start/Stop recording buttons
- No fixed duration required
- Automatic MP4 timelapse build on stop
- Minimal black/white UI with one vibrant accent

## Requirements

- Node.js 20+
- A webcam

## Setup

```powershell
cd "c:\Users\Ziad\Desktop\Time-Lapse\desktop cctv electrno"
npm install
```

## Run

```powershell
cd "c:\Users\Ziad\Desktop\Time-Lapse\desktop cctv electrno"
npm start
```

## How it works

1. App captures JPEG frames at your chosen interval.
2. Frames are saved in your Videos folder under `StudyCCTV/session_.../frames`.
3. On stop, ffmpeg builds `timelapse_....mp4` automatically in the same session folder.

## Output path

- Windows: `C:\Users\<you>\Videos\StudyCCTV\session_...`
- Linux: `/home/<you>/Videos/StudyCCTV/session_...`

## Quick code checks

```powershell
npm run check
```

## Building for Distribution

To create installable packages for Windows and Linux:

```powershell
npm run build
```

This generates:
- **Windows**: NSIS installer (.exe) and portable executable
- **Linux**: AppImage and .deb packages

Output packages are placed in the `dist/` directory.

For test builds without packaging:
```powershell
npm run pack
```

See [BUILD.md](BUILD.md) for detailed build instructions and troubleshooting.
