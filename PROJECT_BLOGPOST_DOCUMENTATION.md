# Building Study CCTV Desktop: A Practical Electron Timelapse System

Author: Project Team  
Project: Study CCTV Desktop  
Stack: Electron + Vanilla JS + ffmpeg-static

## Why This Project Exists

Most productivity apps tell you what you planned to do. This app shows what actually happened.

Study CCTV Desktop is a desktop-first timelapse recorder built to capture long study sessions with minimal friction. You open the app, start a session, and it records periodic webcam frames. When you stop, it renders a final MP4 timelapse automatically.

The bigger goal is not surveillance. It is personal accountability and retrospective insight: how often you showed up, how long sessions lasted, and how your consistency changed over time.

## The Big Picture

At a high level, the app is a three-layer Electron architecture:

1. Main process
2. Preload bridge
3. Renderer UI

The main process handles filesystem access, session metadata, and ffmpeg execution. The renderer handles camera input, live UI state, and user interaction. The preload file exposes a safe IPC API so renderer code never gets full Node.js access.

This gives a practical security baseline while still keeping the implementation lightweight.

## Architecture Walkthrough

### 1) Main Process Responsibilities

Main process code lives in src/main.js and handles:

1. App window lifecycle
2. Session folder creation
3. Frame saving from data URLs
4. MP4 rendering using ffmpeg-static
5. Settings and history persistence
6. Dashboard data aggregation
7. Folder picker dialogs
8. Utility tasks like disk usage checks and notifications

The persistence model is a local JSON store in the Electron userData directory. It contains two roots:

1. settings
2. sessions

This keeps data management simple and transparent.

### 2) Preload Bridge

Preload code in src/preload.js uses contextBridge + ipcRenderer.invoke to expose a single API object into the browser context.

That API is the contract between UI and system layer. It includes actions for:

1. Creating sessions
2. Saving frames
3. Building videos
4. Loading and saving settings
5. Getting dashboard and storage information

### 3) Renderer UI

Renderer files are in src/renderer:

1. index.html for structure
2. styles.css for visual design
3. renderer.js for runtime behavior

The UI follows a clear flow:

1. Home screen with aggregate stats and recent sessions
2. New Session setup screen
3. Recording screen with live preview and status
4. Profile/settings side panel with tabbed controls

## Core Recording Workflow

The core lifecycle looks like this:

1. User enters session name and tag
2. Renderer asks main process to create a session folder
3. Renderer captures frames on interval and sends each to main process
4. Main process writes frames as frame_000001.jpg style files
5. On stop, renderer asks main process to run ffmpeg and build MP4
6. Metadata is finalized and stored in session history
7. Dashboard and recent sessions refresh in UI

### Output Folder Pattern

Sessions are written under the configured output root with timestamped folders:

1. session_YYYY-MM-DD..._<name>_<tag>
2. frames subfolder for source images
3. timelapse_*.mp4 as final output

## Data Model

Each session record stores useful playback and analytics metadata, including:

1. Session identity (id, name, tag, createdAt)
2. Capture parameters (intervalSeconds, fps)
3. Computed output stats (frameCount, timeLapseMinutes)
4. Output paths (video and optional thumbnail)
5. Focus timeline fields for future or advanced analysis

Settings include capture defaults, storage preferences, and appearance options. This means each launch can resume your preferred behavior without reconfiguration.

## UI and Design System

The visual language is intentionally cinematic and control-room inspired:

1. Glass-like cards and ambient background gradients
2. Theme presets (multiple built-in palettes)
3. Animated state pill for recording feedback
4. Responsive layout that compresses cleanly on smaller widths
5. Side-panel settings to avoid context-switching screens

The renderer applies theme and style settings via CSS variables and data attributes on the body element. This keeps the appearance engine clean and centralized.

## Feature Set

Current project capabilities include:

1. Live webcam preview
2. Start/stop timelapse session control
3. Adjustable capture interval and output FPS
4. Automatic MP4 build after recording
5. Build from an existing folder of image frames
6. Session history + dashboard aggregates
7. Profile name and personalized welcome
8. Theme/border/corner customization
9. Configurable output directory
10. Data reset option

Recent implementation work also introduces expanded intelligence and automation paths:

1. Motion-triggered capture support with threshold controls
2. Video overlay options (timestamp, session watermark, progress bar)
3. Thumbnail generation for rendered videos
4. Disk usage monitoring and warning threshold logic
5. OS-level notification hook when builds finish
6. Monthly digest builder to combine recent sessions

## Build and Distribution Story

The project uses Electron Builder for packaging.

Configured targets:

1. Windows NSIS installer
2. Windows portable build
3. Linux AppImage
4. Linux DEB package

Helpful scripts in package.json:

1. npm start for local run
2. npm run check for syntax checks
3. npm run build for distributable builds
4. npm run pack for unpackaged test build

## Project Structure Tour

Top-level files and folders:

1. src/main.js: Electron main process and IPC handlers
2. src/preload.js: secure API bridge
3. src/renderer/index.html: UI markup
4. src/renderer/renderer.js: app behavior and state
5. src/renderer/styles.css: full theme and layout system
6. scripts/generate-icons.js: icon utility
7. BUILD.md: packaging and troubleshooting notes
8. FEATURES.md: concise feature inventory

## Engineering Decisions Worth Calling Out

### Why JSON storage instead of a database?

For a local-first desktop utility, JSON keeps complexity low and reliability high. The data volume is modest, write frequency is controlled, and migration burden stays manageable.

### Why ffmpeg-static?

Bundling ffmpeg avoids system-level dependency setup and gives deterministic video behavior across developer machines and packaged app installs.

### Why contextIsolation enabled?

It reduces renderer attack surface and enforces cleaner boundaries between UI logic and privileged system actions.

## Lessons Learned During Development

1. Session naming and filesystem safety must be handled early to prevent edge-case path failures.
2. Timelapse quality is strongly tied to interval and scene dynamics, so sane defaults matter.
3. Long-session tooling benefits from immediate visual feedback: counters, status pills, and recent history visibility.
4. Packaging should be tested early; install-time details often reveal hidden assumptions.

## Where This Project Can Go Next

Natural next milestones:

1. Rich focus heatmap visualization with charts
2. Session comparison dashboard (weekly/monthly trends)
3. Exportable session report bundles
4. Optional cloud sync for metadata only
5. Smarter chaptering and highlight extraction for digest videos

## Closing

Study CCTV Desktop is a focused example of a practical Electron product: useful core value, clear architecture, and room for meaningful growth. It starts simple, but it already creates a durable personal archive of work.

If you are publishing or open-sourcing this project, the key strengths to emphasize are:

1. Fast setup
2. Local-first privacy
3. Cross-platform packaging
4. A roadmap that bridges productivity and lightweight computer vision
