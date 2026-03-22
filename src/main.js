const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

let mainWindow;

const DEFAULT_SETTINGS = {
  intervalSeconds: 1.5,
  outputFps: 30,
  defaultTag: 'desktop',
  outputDirectory: '',
  theme: 'lumon',
  mirrorCorrection: true,
  motionTriggeredCapture: false,
  motionThreshold: 0.08,
  overlayTimestamp: true,
  overlaySessionName: true,
  overlayProgressBar: false,
  diskWarningGb: 5,
  hotkeyEnabled: true,
  userName: '',
  borderStyle: 'full',
  cornerStyle: 'rounded',
};

const FRAME_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp']);

function getStorePath() {
  return path.join(app.getPath('userData'), 'study-cctv-store.json');
}

async function readStore() {
  const storePath = getStorePath();
  try {
    const raw = await fs.readFile(storePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return {
      settings: { ...DEFAULT_SETTINGS },
      sessions: [],
    };
  }
}

async function writeStore(store) {
  const storePath = getStorePath();
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), 'utf8');
}

async function getDashboardStats() {
  const store = await readStore();
  const totalFrames = store.sessions.reduce((sum, session) => {
    return sum + Number(session.frameCount || 0);
  }, 0);
  const totalMinutes = store.sessions.reduce((sum, session) => {
    return sum + Number(session.timeLapseMinutes || 0);
  }, 0);

  return {
    sessionCount: store.sessions.length,
    totalFrames,
    totalMinutes,
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 980,
    minHeight: 700,
    backgroundColor: '#0b0b0b',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function sanitizeTag(value) {
  return String(value || 'session').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function sanitizeName(value) {
  return String(value || 'session').replace(/[^a-zA-Z0-9 _-]/g, '_').trim() || 'session';
}

function getDefaultOutputDirectory() {
  return path.join(app.getPath('videos'), 'StudyCCTV');
}

function escapeDrawText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/,/g, '\\,')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

function buildOverlayFilter(overlayOptions, sessionName, durationSeconds) {
  const options = overlayOptions || {};
  const filters = [];

  if (options.showTimestamp) {
    filters.push("drawtext=fontcolor=white:fontsize=20:box=1:boxcolor=black@0.45:boxborderw=6:x=12:y=12:text='%{pts\\:hms}'");
  }

  if (options.showSessionName) {
    const safeName = escapeDrawText(sessionName || 'session');
    filters.push(`drawtext=fontcolor=white:fontsize=20:box=1:boxcolor=black@0.45:boxborderw=6:x=12:y=h-th-18:text='${safeName}'`);
  }

  if (options.showProgressBar) {
    const safeDuration = Number.isFinite(Number(durationSeconds)) && Number(durationSeconds) > 0
      ? Number(durationSeconds)
      : 1;
    filters.push("drawbox=x=10:y=h-14:w=iw-20:h=6:color=black@0.45:t=fill");
    filters.push(`drawbox=x=10:y=h-14:w='(iw-20)*if(lt(t,${safeDuration}),t/${safeDuration},1)':h=6:color=white@0.8:t=fill`);
  }

  return filters.length ? filters.join(',') : '';
}

async function runFfmpeg(args) {
  if (!ffmpegPath) {
    throw new Error('ffmpeg-static binary not found');
  }

  await new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { windowsHide: true });
    let stderr = '';

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr || `ffmpeg exited with code ${code}`));
      }
    });
  });
}

async function createThumbnail(videoPath, thumbnailPath) {
  await fs.mkdir(path.dirname(thumbnailPath), { recursive: true });
  const args = [
    '-y',
    '-ss',
    '0',
    '-i',
    videoPath,
    '-vframes',
    '1',
    '-vf',
    'scale=360:-1',
    thumbnailPath,
  ];
  await runFfmpeg(args);
  return thumbnailPath;
}

async function getDirectorySizeBytes(rootPath) {
  let total = 0;

  async function walk(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        total += stats.size;
      }
    }
  }

  try {
    await walk(rootPath);
  } catch {
    return 0;
  }

  return total;
}

ipcMain.handle('session:create', async (_event, payload) => {
  const store = await readStore();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tag = sanitizeTag(payload && payload.tag);
  const name = sanitizeName(payload && payload.name);
  const outputBaseDir = String(payload && payload.outputDirectory)
    || String(store.settings.outputDirectory)
    || getDefaultOutputDirectory();
  const root = path.join(outputBaseDir, `session_${stamp}_${sanitizeTag(name)}_${tag}`);
  const framesDir = path.join(root, 'frames');
  const outputPath = path.join(root, `timelapse_${stamp}.mp4`);
  const thumbnailPath = path.join(root, `thumbnail_${stamp}.jpg`);

  await fs.mkdir(framesDir, { recursive: true });

  return { root, framesDir, outputPath, thumbnailPath, createdAt: new Date().toISOString() };
});

ipcMain.handle('session:saveFrame', async (_event, payload) => {
  const { framesDir, frameNumber, imageDataUrl } = payload || {};
  if (!framesDir || typeof frameNumber !== 'number' || !imageDataUrl) {
    throw new Error('Invalid saveFrame payload');
  }

  const marker = 'base64,';
  const idx = imageDataUrl.indexOf(marker);
  if (idx < 0) {
    throw new Error('Expected base64 image data URL');
  }

  const base64 = imageDataUrl.slice(idx + marker.length);
  const fileName = `frame_${String(frameNumber).padStart(6, '0')}.jpg`;
  const fullPath = path.join(framesDir, fileName);
  await fs.writeFile(fullPath, base64, 'base64');

  return { fullPath };
});

ipcMain.handle('session:buildVideo', async (_event, payload) => {
  const {
    framesDir,
    outputPath,
    fps,
    overlayOptions,
    sessionName,
    durationSeconds,
  } = payload || {};
  if (!framesDir || !outputPath || !fps) {
    throw new Error('Invalid buildVideo payload');
  }

  const overlayFilter = buildOverlayFilter(overlayOptions, sessionName, durationSeconds);

  const args = [
    '-y',
    '-framerate',
    String(fps),
    '-i',
    path.join(framesDir, 'frame_%06d.jpg'),
  ];

  if (overlayFilter) {
    args.push('-vf', overlayFilter);
  }

  args.push(
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    outputPath,
  );

  await runFfmpeg(args);

  return { outputPath };
});

ipcMain.handle('session:buildVideoFromFolder', async (_event, payload) => {
  const {
    framesDirectory,
    outputPath,
    fps,
    overlayOptions,
    sessionName,
  } = payload || {};
  if (!framesDirectory || !outputPath || !fps) {
    throw new Error('Invalid buildVideoFromFolder payload');
  }

  const directoryEntries = await fs.readdir(framesDirectory, { withFileTypes: true });
  const imageFiles = directoryEntries
    .filter((entry) => entry.isFile())
    .filter((entry) => FRAME_IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  if (imageFiles.length < 2) {
    throw new Error('Selected folder needs at least 2 image files');
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const listFilePath = path.join(path.dirname(outputPath), `frames_list_${Date.now()}.txt`);
  const listBody = imageFiles
    .map((fileName) => {
      const fullPath = path.join(framesDirectory, fileName).replace(/\\/g, '/').replace(/'/g, "'\\''");
      return `file '${fullPath}'`;
    })
    .join('\n');

  await fs.writeFile(listFilePath, `${listBody}\n`, 'utf8');

  const durationSeconds = imageFiles.length / Number(fps);
  const overlayFilter = buildOverlayFilter(overlayOptions, sessionName, durationSeconds);

  const args = [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    listFilePath,
  ];

  const videoFilters = [`fps=${String(fps)}`];
  if (overlayFilter) {
    videoFilters.push(overlayFilter);
  }
  args.push('-vf', videoFilters.join(','));
  args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', outputPath);

  try {
    await runFfmpeg(args);
  } finally {
    await fs.unlink(listFilePath).catch(() => {});
  }

  return { outputPath, frameCount: imageFiles.length };
});

ipcMain.handle('session:finalize', async (_event, payload) => {
  const {
    name,
    tag,
    intervalSeconds,
    fps,
    frameCount,
    outputPath,
    thumbnailPath,
    durationSeconds,
    focusTimeline,
    focusAverage,
    engagedMinutes,
    createdAt,
  } = payload || {};

  if (!outputPath || !Number.isFinite(Number(frameCount)) || Number(frameCount) < 0) {
    throw new Error('Invalid finalize payload');
  }

  const store = await readStore();
  const safeInterval = Number(intervalSeconds) > 0 ? Number(intervalSeconds) : DEFAULT_SETTINGS.intervalSeconds;
  const safeFps = Number(fps) > 0 ? Number(fps) : DEFAULT_SETTINGS.outputFps;
  const frames = Math.floor(Number(frameCount));
  const timeLapseMinutes = Number(((frames * safeInterval) / 60).toFixed(2));

  store.sessions.unshift({
    id: `${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    name: sanitizeName(name),
    tag: sanitizeTag(tag),
    createdAt: createdAt || new Date().toISOString(),
    frameCount: frames,
    intervalSeconds: safeInterval,
    fps: safeFps,
    timeLapseMinutes,
    durationSeconds: Number.isFinite(Number(durationSeconds)) ? Number(durationSeconds) : Number((frames / safeFps).toFixed(2)),
    thumbnailPath: thumbnailPath ? String(thumbnailPath) : '',
    focusTimeline: Array.isArray(focusTimeline) ? focusTimeline.slice(0, 5000) : [],
    focusAverage: Number.isFinite(Number(focusAverage)) ? Number(focusAverage) : 0,
    engagedMinutes: Number.isFinite(Number(engagedMinutes)) ? Number(engagedMinutes) : 0,
    outputPath: String(outputPath),
  });

  await writeStore(store);
  return { ok: true };
});

ipcMain.handle('data:getDashboard', async () => {
  const store = await readStore();
  const stats = await getDashboardStats();
  return {
    stats,
    sessions: store.sessions.slice(0, 12),
  };
});

ipcMain.handle('settings:get', async () => {
  const store = await readStore();
  return store.settings;
});

ipcMain.handle('settings:save', async (_event, payload) => {
  const store = await readStore();
  const next = {
    ...store.settings,
    ...(payload || {}),
  };

  if (!Number.isFinite(Number(next.intervalSeconds)) || Number(next.intervalSeconds) <= 0) {
    next.intervalSeconds = DEFAULT_SETTINGS.intervalSeconds;
  }
  if (!Number.isFinite(Number(next.outputFps)) || Number(next.outputFps) <= 0) {
    next.outputFps = DEFAULT_SETTINGS.outputFps;
  }
  if (!next.defaultTag) {
    next.defaultTag = DEFAULT_SETTINGS.defaultTag;
  }
  if (!next.theme) {
    next.theme = DEFAULT_SETTINGS.theme;
  }
  if (!Number.isFinite(Number(next.motionThreshold)) || Number(next.motionThreshold) <= 0 || Number(next.motionThreshold) > 1) {
    next.motionThreshold = DEFAULT_SETTINGS.motionThreshold;
  }
  if (!Number.isFinite(Number(next.diskWarningGb)) || Number(next.diskWarningGb) <= 0) {
    next.diskWarningGb = DEFAULT_SETTINGS.diskWarningGb;
  }
  next.motionTriggeredCapture = Boolean(next.motionTriggeredCapture);
  next.overlayTimestamp = next.overlayTimestamp !== false;
  next.overlaySessionName = next.overlaySessionName !== false;
  next.overlayProgressBar = Boolean(next.overlayProgressBar);
  next.hotkeyEnabled = next.hotkeyEnabled !== false;
  if (next.borderStyle !== 'underline' && next.borderStyle !== 'full') {
    next.borderStyle = DEFAULT_SETTINGS.borderStyle;
  }
  if (next.cornerStyle !== 'boxy' && next.cornerStyle !== 'rounded') {
    next.cornerStyle = DEFAULT_SETTINGS.cornerStyle;
  }
  next.userName = String(next.userName || '').trim();

  store.settings = next;
  await writeStore(store);
  return store.settings;
});

ipcMain.handle('settings:pickOutputDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Session Output Directory',
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || !result.filePaths[0]) {
    return { canceled: true };
  }

  return {
    canceled: false,
    directory: result.filePaths[0],
  };
});

ipcMain.handle('settings:pickFramesDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Folder With Frames',
    properties: ['openDirectory'],
  });

  if (result.canceled || !result.filePaths[0]) {
    return { canceled: true };
  }

  return {
    canceled: false,
    directory: result.filePaths[0],
  };
});

ipcMain.handle('data:clearAll', async () => {
  await writeStore({
    settings: { ...DEFAULT_SETTINGS },
    sessions: [],
  });
  return { ok: true };
});

ipcMain.handle('data:getDiskUsage', async (_event, payload) => {
  const store = await readStore();
  const targetDirectory = String(payload && payload.directory)
    || String(store.settings.outputDirectory)
    || getDefaultOutputDirectory();
  const warningGb = Number.isFinite(Number(store.settings.diskWarningGb))
    ? Number(store.settings.diskWarningGb)
    : DEFAULT_SETTINGS.diskWarningGb;

  const bytes = await getDirectorySizeBytes(targetDirectory);
  const gigaBytes = bytes / (1024 * 1024 * 1024);

  return {
    directory: targetDirectory,
    bytes,
    gigaBytes,
    warningGb,
    warning: gigaBytes >= warningGb,
  };
});

ipcMain.handle('session:createThumbnail', async (_event, payload) => {
  const { outputPath, thumbnailPath } = payload || {};
  if (!outputPath || !thumbnailPath) {
    throw new Error('Invalid createThumbnail payload');
  }
  const createdPath = await createThumbnail(String(outputPath), String(thumbnailPath));
  return { thumbnailPath: createdPath };
});

ipcMain.handle('digest:buildMonthly', async (_event, payload) => {
  const store = await readStore();
  const days = Number.isFinite(Number(payload && payload.days)) && Number(payload.days) > 0
    ? Number(payload.days)
    : 30;
  const nowMs = Date.now();
  const thresholdMs = nowMs - (days * 24 * 60 * 60 * 1000);

  const selected = [];
  for (const session of store.sessions) {
    const createdMs = Date.parse(session.createdAt || '');
    if (!Number.isFinite(createdMs) || createdMs < thresholdMs) {
      continue;
    }
    try {
      await fs.access(session.outputPath);
      selected.push(session);
    } catch {
      // Ignore sessions with missing videos.
    }
  }

  if (selected.length < 2) {
    throw new Error('Need at least 2 recent sessions with existing video files to build a digest');
  }

  selected.sort((a, b) => {
    const ams = Date.parse(a.createdAt || '') || 0;
    const bms = Date.parse(b.createdAt || '') || 0;
    return ams - bms;
  });

  const outputBaseDir = String(payload && payload.outputDirectory)
    || String(store.settings.outputDirectory)
    || getDefaultOutputDirectory();
  await fs.mkdir(outputBaseDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(outputBaseDir, `monthly_digest_${stamp}.mp4`);
  const thumbnailPath = path.join(outputBaseDir, `monthly_digest_${stamp}.jpg`);
  const chapterPath = path.join(outputBaseDir, `monthly_digest_${stamp}.chapters.txt`);
  const listFilePath = path.join(outputBaseDir, `monthly_digest_${stamp}.txt`);

  const listBody = selected
    .map((session) => {
      const escaped = String(session.outputPath).replace(/\\/g, '/').replace(/'/g, "'\\''");
      return `file '${escaped}'`;
    })
    .join('\n');

  await fs.writeFile(listFilePath, `${listBody}\n`, 'utf8');

  try {
    try {
      await runFfmpeg([
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', listFilePath,
        '-c', 'copy',
        outputPath,
      ]);
    } catch {
      await runFfmpeg([
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', listFilePath,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        outputPath,
      ]);
    }
  } finally {
    await fs.unlink(listFilePath).catch(() => {});
  }

  const chapterLines = [];
  let cursorSeconds = 0;
  for (const session of selected) {
    chapterLines.push(`${Math.floor(cursorSeconds)}s - ${session.name || 'session'} (${session.tag || 'untagged'})`);
    const duration = Number.isFinite(Number(session.durationSeconds)) && Number(session.durationSeconds) > 0
      ? Number(session.durationSeconds)
      : ((Number(session.frameCount) || 0) / (Number(session.fps) || DEFAULT_SETTINGS.outputFps));
    cursorSeconds += Math.max(0, duration);
  }
  await fs.writeFile(chapterPath, `${chapterLines.join('\n')}\n`, 'utf8');
  await createThumbnail(outputPath, thumbnailPath);

  return {
    outputPath,
    chapterPath,
    thumbnailPath,
    sessionCount: selected.length,
  };
});

ipcMain.handle('notify:buildFinished', async (_event, payload) => {
  const title = String((payload && payload.title) || 'Study CCTV Build Finished');
  const body = String((payload && payload.body) || 'Your timelapse build has completed.');

  if (!Notification.isSupported()) {
    return { shown: false };
  }

  const notification = new Notification({ title, body });
  notification.show();
  return { shown: true };
});
