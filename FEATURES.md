# Study CCTV Desktop - Feature List

This document lists the features currently provided by the application.

## Core Recording Features

- Live webcam preview before and during recording.
- Start/stop recording flow with immediate frame capture on session start.
- Adjustable capture interval (seconds between frames).
- Automatic frame saving to numbered JPEG files.
- Automatic timelapse video build (MP4/H.264) when recording stops.
- Build protection requiring at least 2 frames before creating a video.

## Session Management

- Session naming and tagging before each run.
- Safe session/tag sanitization for filesystem-friendly folder names.
- Automatic session folder creation with timestamped naming.
- Per-session output with this structure:
  - Session root folder
  - `frames` subfolder with captured images
  - Final `timelapse_*.mp4` output file
- Session metadata saved after build (name, tag, frame count, interval, FPS, runtime minutes, output path, creation date).

## Build From Existing Frames

- Build a timelapse from an existing folder of images (without recording live camera input).
- Folder picker for selecting the input frames directory.
- Supports image extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`.
- Natural sorting for frame filenames before video creation.
- Stores built-from-folder sessions in dashboard history just like normal recordings.

## Dashboard and History

- Home dashboard with aggregate stats:
  - Total sessions recorded
  - Total frames captured
  - Total timelapse minutes
- Recent sessions list (latest entries with name, frame count, and minutes).

## Profile and Settings

- Profile onboarding prompt for operator name.
- Persistent profile name shown in UI.
- Capture settings:
  - Interval seconds
  - Output FPS
  - Default session tag
  - Mirror correction toggle
- Storage settings:
  - Custom output directory picker
  - Read-only display of selected output path
- Appearance settings:
  - Theme selector with 19 built-in themes
  - Border style toggle (`full` or `underline`)
  - Corner style toggle (`rounded` or `boxy`)
- One-click save settings.
- One-click clear-all-data (resets settings and session history).

## Data Persistence

- Local JSON store in the app user data directory.
- Persists both settings and session history between launches.
- Defaults applied and validated when values are missing/invalid.

## Output and Processing

- Uses bundled `ffmpeg-static` binary for local video rendering.
- Encodes output as H.264 with `yuv420p` for broad compatibility.
- Creates output directories automatically when needed.

## Platform and Packaging

- Desktop app built with Electron.
- Runs on Windows and Linux.
- Distribution builds configured with electron-builder:
  - Windows: NSIS installer and portable build (x64)
  - Linux: AppImage and DEB
- App icon generation support via build script.

## UI/UX Notes

- Multi-screen flow: Home -> New Session -> Recording.
- Status feedback states (Ready, Recording, Processing, Done, and error states).
- Frame counter and output path feedback shown in recording UI.
- Slide-in profile/settings panel with tabbed sections (Profile, Capture, Appearance, Storage).
