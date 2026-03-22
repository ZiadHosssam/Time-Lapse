const preview = document.getElementById('preview');
const canvas = document.getElementById('captureCanvas');
const intervalInput = document.getElementById('intervalInput');
const fpsInput = document.getElementById('fpsInput');
const defaultTagInput = document.getElementById('defaultTagInput');
const outputDirInput = document.getElementById('outputDirInput');
const themeSelect = document.getElementById('themeSelect');
const borderStyleSelect = document.getElementById('borderStyleSelect');
const cornerStyleSelect = document.getElementById('cornerStyleSelect');
const mirrorToggle = document.getElementById('mirrorToggle');
const userNameInput = document.getElementById('userNameInput');
const tagInput = document.getElementById('tagInput');
const sessionNameInput = document.getElementById('sessionNameInput');
const welcomeText = document.getElementById('welcomeText');

const homeScreen = document.getElementById('homeScreen');
const setupScreen = document.getElementById('setupScreen');
const recordScreen = document.getElementById('recordScreen');

const toSetupBtn = document.getElementById('toSetupBtn');
const backHomeBtn = document.getElementById('backHomeBtn');
const beginSessionBtn = document.getElementById('beginSessionBtn');
const buildFromFolderBtn = document.getElementById('buildFromFolderBtn');
const buildDigestBtn = document.getElementById('buildDigestBtn');
const stopBtn = document.getElementById('stopBtn');

const profileBtn = document.getElementById('profileBtn');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const profilePanel = document.getElementById('profilePanel');
const panelBackdrop = document.getElementById('panelBackdrop');
const panelTabs = Array.from(document.querySelectorAll('.panel-tab'));
const panelViews = Array.from(document.querySelectorAll('.panel-view'));
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const pickOutputDirBtn = document.getElementById('pickOutputDirBtn');
const clearDataBtn = document.getElementById('clearDataBtn');
const motionCaptureToggle = document.getElementById('motionCaptureToggle');
const motionThresholdInput = document.getElementById('motionThresholdInput');
const overlayTimestampToggle = document.getElementById('overlayTimestampToggle');
const overlaySessionNameToggle = document.getElementById('overlaySessionNameToggle');
const overlayProgressBarToggle = document.getElementById('overlayProgressBarToggle');
const diskWarningInput = document.getElementById('diskWarningInput');
const diskUsageText = document.getElementById('diskUsageText');
const hotkeyToggle = document.getElementById('hotkeyToggle');

const sessionsStatEl = document.getElementById('sessionsStat');
const framesStatEl = document.getElementById('framesStat');
const minutesStatEl = document.getElementById('minutesStat');
const panelSessionsStatEl = document.getElementById('panelSessionsStat');
const panelFramesStatEl = document.getElementById('panelFramesStat');
const panelMinutesStatEl = document.getElementById('panelMinutesStat');
const panelUserNameEl = document.getElementById('panelUserName');
const recentSessionsEl = document.getElementById('recentSessions');

const framesEl = document.getElementById('frames');
const stateEl = document.getElementById('state');
const statePillEl = document.getElementById('statePill');
const outputEl = document.getElementById('outputPath');

let stream = null;
let timerId = null;
let inFlight = false;
let frameCount = 0;
let recording = false;
let session = null;
let processingFromFolder = false;
let lastMotionFrame = null;
let focusTimeline = [];
let focusTotalScore = 0;
let focusEngagedFrames = 0;
let captureTick = 0;
let settings = {
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

const THEME_PRESETS = {
  lumon: { label: 'Lumon', bg0: '#071114', bg1: '#0f1d22', bg2: '#162a31', glass: 'rgba(178, 221, 223, 0.1)', glassStrong: 'rgba(214, 241, 242, 0.15)', line: 'rgba(187, 232, 234, 0.28)', text: '#e8f7f7', muted: '#a4c3c4', accent: '#c9f66f', accentSoft: 'rgba(201, 246, 111, 0.18)', danger: '#ff6f8e' },
  arctic: { label: 'Arctic', bg0: '#0b1322', bg1: '#14243d', bg2: '#1f3558', glass: 'rgba(194, 225, 255, 0.12)', glassStrong: 'rgba(218, 236, 255, 0.16)', line: 'rgba(196, 224, 255, 0.34)', text: '#eaf2ff', muted: '#aec2e8', accent: '#8dd9ff', accentSoft: 'rgba(141, 217, 255, 0.2)', danger: '#ff7f9f' },
  graphite: { label: 'Graphite', bg0: '#131518', bg1: '#23282f', bg2: '#323a43', glass: 'rgba(216, 222, 229, 0.1)', glassStrong: 'rgba(226, 232, 239, 0.15)', line: 'rgba(207, 216, 226, 0.29)', text: '#eef2f6', muted: '#bdc7d1', accent: '#b9f575', accentSoft: 'rgba(185, 245, 117, 0.18)', danger: '#ff869f' },
  dracula: { label: 'Dracula', bg0: '#1f1b2e', bg1: '#2a2640', bg2: '#372f54', glass: 'rgba(214, 186, 255, 0.11)', glassStrong: 'rgba(226, 209, 255, 0.16)', line: 'rgba(219, 196, 255, 0.3)', text: '#f4eeff', muted: '#c9bce6', accent: '#ffb86c', accentSoft: 'rgba(255, 184, 108, 0.22)', danger: '#ff6e9e' },
  catppuccin: { label: 'Catppuccin Mocha', bg0: '#181825', bg1: '#1e1e2e', bg2: '#313244', glass: 'rgba(205, 214, 244, 0.1)', glassStrong: 'rgba(205, 214, 244, 0.14)', line: 'rgba(166, 173, 200, 0.31)', text: '#cdd6f4', muted: '#a6adc8', accent: '#89dceb', accentSoft: 'rgba(137, 220, 235, 0.22)', danger: '#f38ba8' },
  githubDark: { label: 'GitHub Dark', bg0: '#0d1117', bg1: '#161b22', bg2: '#21262d', glass: 'rgba(177, 186, 196, 0.1)', glassStrong: 'rgba(177, 186, 196, 0.14)', line: 'rgba(139, 148, 158, 0.34)', text: '#c9d1d9', muted: '#8b949e', accent: '#58a6ff', accentSoft: 'rgba(88, 166, 255, 0.22)', danger: '#ff7b72' },
  nord: { label: 'Nord', bg0: '#2e3440', bg1: '#3b4252', bg2: '#434c5e', glass: 'rgba(216, 222, 233, 0.1)', glassStrong: 'rgba(229, 233, 240, 0.14)', line: 'rgba(216, 222, 233, 0.3)', text: '#eceff4', muted: '#d8dee9', accent: '#88c0d0', accentSoft: 'rgba(136, 192, 208, 0.2)', danger: '#bf616a' },
  solarizedDark: { label: 'Solarized Dark', bg0: '#002b36', bg1: '#073642', bg2: '#0b4b59', glass: 'rgba(147, 161, 161, 0.11)', glassStrong: 'rgba(147, 161, 161, 0.16)', line: 'rgba(131, 148, 150, 0.32)', text: '#eee8d5', muted: '#93a1a1', accent: '#b58900', accentSoft: 'rgba(181, 137, 0, 0.22)', danger: '#dc322f' },
  monokai: { label: 'Monokai', bg0: '#1f201b', bg1: '#272822', bg2: '#313229', glass: 'rgba(230, 219, 116, 0.1)', glassStrong: 'rgba(230, 219, 116, 0.14)', line: 'rgba(166, 226, 46, 0.3)', text: '#f8f8f2', muted: '#b8b89f', accent: '#a6e22e', accentSoft: 'rgba(166, 226, 46, 0.22)', danger: '#f92672' },
  oneDark: { label: 'One Dark', bg0: '#1e222a', bg1: '#282c34', bg2: '#323842', glass: 'rgba(171, 178, 191, 0.1)', glassStrong: 'rgba(171, 178, 191, 0.15)', line: 'rgba(171, 178, 191, 0.31)', text: '#abb2bf', muted: '#8a909e', accent: '#61afef', accentSoft: 'rgba(97, 175, 239, 0.22)', danger: '#e06c75' },
  tokyoNight: { label: 'Tokyo Night', bg0: '#1a1b26', bg1: '#24283b', bg2: '#2f354d', glass: 'rgba(192, 202, 245, 0.1)', glassStrong: 'rgba(192, 202, 245, 0.15)', line: 'rgba(169, 177, 214, 0.31)', text: '#c0caf5', muted: '#a9b1d6', accent: '#7aa2f7', accentSoft: 'rgba(122, 162, 247, 0.22)', danger: '#f7768e' },
  gruvboxDark: { label: 'Gruvbox Dark', bg0: '#282828', bg1: '#32302f', bg2: '#3c3836', glass: 'rgba(213, 196, 161, 0.1)', glassStrong: 'rgba(213, 196, 161, 0.15)', line: 'rgba(168, 153, 132, 0.31)', text: '#ebdbb2', muted: '#a89984', accent: '#fabd2f', accentSoft: 'rgba(250, 189, 47, 0.22)', danger: '#fb4934' },
  everforestDark: { label: 'Everforest Dark', bg0: '#2b3339', bg1: '#323c41', bg2: '#3a464c', glass: 'rgba(211, 198, 170, 0.1)', glassStrong: 'rgba(211, 198, 170, 0.14)', line: 'rgba(163, 177, 138, 0.32)', text: '#d3c6aa', muted: '#9da9a0', accent: '#a7c080', accentSoft: 'rgba(167, 192, 128, 0.22)', danger: '#e67e80' },
  rosePine: { label: 'Rose Pine', bg0: '#191724', bg1: '#1f1d2e', bg2: '#26233a', glass: 'rgba(224, 222, 244, 0.1)', glassStrong: 'rgba(224, 222, 244, 0.15)', line: 'rgba(144, 122, 169, 0.31)', text: '#e0def4', muted: '#908caa', accent: '#9ccfd8', accentSoft: 'rgba(156, 207, 216, 0.22)', danger: '#eb6f92' },
  cyberpunk: { label: 'Cyberpunk', bg0: '#0b0417', bg1: '#1c0f31', bg2: '#301d4a', glass: 'rgba(255, 77, 166, 0.12)', glassStrong: 'rgba(255, 150, 59, 0.16)', line: 'rgba(0, 255, 200, 0.3)', text: '#f7f0ff', muted: '#d7bdf0', accent: '#00ffc8', accentSoft: 'rgba(0, 255, 200, 0.24)', danger: '#ff4da6' },
  matrix: { label: 'Matrix', bg0: '#020503', bg1: '#06110a', bg2: '#0b1e13', glass: 'rgba(124, 252, 0, 0.08)', glassStrong: 'rgba(160, 255, 97, 0.12)', line: 'rgba(124, 252, 0, 0.28)', text: '#d8ffd0', muted: '#98c98f', accent: '#7cff00', accentSoft: 'rgba(124, 252, 0, 0.18)', danger: '#ff5e7d' },
  oceanic: { label: 'Oceanic', bg0: '#082032', bg1: '#0a2a43', bg2: '#12415f', glass: 'rgba(107, 177, 227, 0.1)', glassStrong: 'rgba(154, 204, 237, 0.15)', line: 'rgba(154, 204, 237, 0.3)', text: '#e3f3ff', muted: '#9cc6e2', accent: '#5edfff', accentSoft: 'rgba(94, 223, 255, 0.22)', danger: '#ff8598' },
  sunset: { label: 'Sunset', bg0: '#2a1020', bg1: '#482039', bg2: '#6b2f4d', glass: 'rgba(255, 191, 128, 0.1)', glassStrong: 'rgba(255, 220, 171, 0.15)', line: 'rgba(255, 195, 129, 0.3)', text: '#fff1e6', muted: '#e6bca7', accent: '#ffd166', accentSoft: 'rgba(255, 209, 102, 0.22)', danger: '#ff6b85' },
  midnightBloom: { label: 'Midnight Bloom', bg0: '#120b24', bg1: '#1d1438', bg2: '#30215a', glass: 'rgba(194, 183, 255, 0.1)', glassStrong: 'rgba(214, 206, 255, 0.14)', line: 'rgba(194, 183, 255, 0.3)', text: '#efe9ff', muted: '#b8adde', accent: '#7df9ff', accentSoft: 'rgba(125, 249, 255, 0.22)', danger: '#ff7db9' },
};

function showScreen(target) {
  for (const screen of [homeScreen, setupScreen, recordScreen]) {
    screen.classList.remove('screen-active');
  }
  target.classList.add('screen-active');
}

function setStatus(text) {
  stateEl.textContent = `Status: ${text}`;

  if (text === 'Recording') {
    statePillEl.textContent = 'Recording';
    statePillEl.classList.add('is-recording');
    return;
  }

  if (text.startsWith('Building')) {
    statePillEl.textContent = 'Processing';
    statePillEl.classList.remove('is-recording');
    return;
  }

  if (text === 'Done') {
    statePillEl.textContent = 'Complete';
    statePillEl.classList.remove('is-recording');
    return;
  }

  statePillEl.textContent = 'Standby';
  statePillEl.classList.remove('is-recording');
}

function setFrames(count) {
  framesEl.textContent = `Frames: ${count}`;
}

function formatMinutes(value) {
  return Number(value || 0).toFixed(2);
}

function applyTheme(theme) {
  const resolvedKey = Object.prototype.hasOwnProperty.call(THEME_PRESETS, theme) ? theme : 'lumon';
  const preset = THEME_PRESETS[resolvedKey];
  document.body.dataset.theme = resolvedKey;
  document.body.style.setProperty('--bg0', preset.bg0);
  document.body.style.setProperty('--bg1', preset.bg1);
  document.body.style.setProperty('--bg2', preset.bg2);
  document.body.style.setProperty('--glass', preset.glass);
  document.body.style.setProperty('--glass-strong', preset.glassStrong);
  document.body.style.setProperty('--line', preset.line);
  document.body.style.setProperty('--text', preset.text);
  document.body.style.setProperty('--muted', preset.muted);
  document.body.style.setProperty('--accent', preset.accent);
  document.body.style.setProperty('--accent-soft', preset.accentSoft);
  document.body.style.setProperty('--danger', preset.danger);
}

function applyBorderStyle(style) {
  document.body.dataset.borderStyle = style === 'underline' ? 'underline' : 'full';
}

function applyCornerStyle(style) {
  document.body.dataset.cornerStyle = style === 'boxy' ? 'boxy' : 'rounded';
}

function applyMirrorCorrection(enabled) {
  preview.classList.toggle('correct-mirror', Boolean(enabled));
}

function getOverlayOptions() {
  return {
    showTimestamp: settings.overlayTimestamp !== false,
    showSessionName: settings.overlaySessionName !== false,
    showProgressBar: Boolean(settings.overlayProgressBar),
  };
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function toFileUrl(value) {
  const normalized = String(value || '').replace(/\\/g, '/');
  return `file:///${encodeURI(normalized)}`;
}

function computeFrameMetrics(imageData) {
  const data = imageData.data;
  const step = 24;
  let sampleCount = 0;
  let prevLuma = 0;
  let lumaTotal = 0;
  let edgeTotal = 0;

  for (let i = 0; i < data.length; i += step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = ((r * 77) + (g * 150) + (b * 29)) >> 8;
    lumaTotal += luma;
    if (sampleCount > 0) {
      edgeTotal += Math.abs(luma - prevLuma);
    }
    prevLuma = luma;
    sampleCount += 1;
  }

  const avgLuma = sampleCount ? (lumaTotal / sampleCount) : 0;
  const detailScore = clamp01(edgeTotal / (sampleCount * 32));

  return {
    sampleCount,
    avgLuma,
    detailScore,
  };
}

function computeMotionScore(currentImageData) {
  if (!lastMotionFrame || !lastMotionFrame.data) {
    return 1;
  }

  const curr = currentImageData.data;
  const prev = lastMotionFrame.data;
  const step = 32;
  let diffSum = 0;
  let sampleCount = 0;

  const maxLength = Math.min(curr.length, prev.length);
  for (let i = 0; i < maxLength; i += step) {
    const cLuma = ((curr[i] * 77) + (curr[i + 1] * 150) + (curr[i + 2] * 29)) >> 8;
    const pLuma = ((prev[i] * 77) + (prev[i + 1] * 150) + (prev[i + 2] * 29)) >> 8;
    diffSum += Math.abs(cLuma - pLuma);
    sampleCount += 1;
  }

  if (!sampleCount) {
    return 0;
  }

  return clamp01(diffSum / (sampleCount * 255));
}

function updateFocusMetrics(motionScore, detailScore) {
  const focusScore = clamp01((detailScore * 0.6) + (motionScore * 0.4));
  const secondMark = Number((captureTick * Number(settings.intervalSeconds || 1.5)).toFixed(2));

  focusTimeline.push({
    second: secondMark,
    score: Number(focusScore.toFixed(3)),
  });

  focusTotalScore += focusScore;
  if (focusScore >= 0.45) {
    focusEngagedFrames += 1;
  }

  if (focusTimeline.length > 2000) {
    focusTimeline = focusTimeline.slice(-2000);
  }
}

async function refreshDiskUsage() {
  try {
    const usage = await window.studyCctvApi.getDiskUsage({
      directory: settings.outputDirectory || '',
    });
    const gbText = Number(usage.gigaBytes || 0).toFixed(2);
    const warnText = Number(usage.warningGb || 0).toFixed(2);
    diskUsageText.textContent = `Disk usage: ${gbText} GB / warning at ${warnText} GB`;
    diskUsageText.classList.toggle('is-warning', Boolean(usage.warning));
  } catch {
    diskUsageText.textContent = 'Disk usage: unavailable';
    diskUsageText.classList.remove('is-warning');
  }
}

function loadSettingsToInputs() {
  intervalInput.value = String(settings.intervalSeconds);
  fpsInput.value = String(settings.outputFps);
  defaultTagInput.value = settings.defaultTag || 'desktop';
  outputDirInput.value = settings.outputDirectory || '';
  userNameInput.value = settings.userName || '';
  themeSelect.value = settings.theme || 'lumon';
  borderStyleSelect.value = settings.borderStyle || 'full';
  cornerStyleSelect.value = settings.cornerStyle || 'rounded';
  mirrorToggle.checked = settings.mirrorCorrection !== false;
  motionCaptureToggle.checked = Boolean(settings.motionTriggeredCapture);
  motionThresholdInput.value = String(settings.motionThreshold || 0.08);
  overlayTimestampToggle.checked = settings.overlayTimestamp !== false;
  overlaySessionNameToggle.checked = settings.overlaySessionName !== false;
  overlayProgressBarToggle.checked = Boolean(settings.overlayProgressBar);
  diskWarningInput.value = String(settings.diskWarningGb || 5);
  hotkeyToggle.checked = settings.hotkeyEnabled !== false;
  applyTheme(settings.theme || 'lumon');
  applyBorderStyle(settings.borderStyle || 'full');
  applyCornerStyle(settings.cornerStyle || 'rounded');
  applyMirrorCorrection(settings.mirrorCorrection !== false);
  const displayName = settings.userName && settings.userName.trim() ? settings.userName.trim() : 'Operator';
  panelUserNameEl.textContent = displayName;
  welcomeText.textContent = `Welcome back, ${displayName}.`;
}

function populateThemeOptions() {
  themeSelect.innerHTML = '';
  for (const [value, preset] of Object.entries(THEME_PRESETS)) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = preset.label;
    themeSelect.appendChild(option);
  }
}

function updateStatsUi(stats) {
  sessionsStatEl.textContent = String(stats.sessionCount || 0);
  framesStatEl.textContent = String(stats.totalFrames || 0);
  minutesStatEl.textContent = formatMinutes(stats.totalMinutes);

  panelSessionsStatEl.textContent = String(stats.sessionCount || 0);
  panelFramesStatEl.textContent = String(stats.totalFrames || 0);
  panelMinutesStatEl.textContent = formatMinutes(stats.totalMinutes);
}

function renderRecentSessions(sessions) {
  recentSessionsEl.innerHTML = '';
  if (!sessions.length) {
    const li = document.createElement('li');
    li.textContent = 'No sessions yet.';
    recentSessionsEl.appendChild(li);
    return;
  }

  for (const item of sessions.slice(0, 8)) {
    const li = document.createElement('li');
    li.className = 'session-item';

    const thumb = item.thumbnailPath ? document.createElement('img') : document.createElement('div');
    thumb.className = 'session-thumb';
    if (item.thumbnailPath) {
      thumb.alt = `${item.name || 'session'} thumbnail`;
      thumb.src = toFileUrl(item.thumbnailPath);
    } else {
      thumb.textContent = 'No preview';
      thumb.classList.add('session-thumb-placeholder');
    }

    const body = document.createElement('div');
    body.className = 'session-body';

    const title = document.createElement('p');
    title.className = 'session-title';
    title.textContent = item.name || 'session';

    const meta = document.createElement('p');
    meta.className = 'session-meta';
    const focus = Number(item.focusAverage || 0);
    meta.textContent = `${item.frameCount} frames · ${formatMinutes(item.timeLapseMinutes)} min · focus ${(focus * 100).toFixed(0)}%`;

    body.appendChild(title);
    body.appendChild(meta);
    li.appendChild(thumb);
    li.appendChild(body);
    recentSessionsEl.appendChild(li);
  }
}

async function refreshDashboard() {
  const payload = await window.studyCctvApi.getDashboard();
  updateStatsUi(payload.stats || {});
  renderRecentSessions(payload.sessions || []);
  await refreshDiskUsage();
}

function openProfilePanel() {
  setPanelView('profile');
  profilePanel.classList.add('open');
  profilePanel.setAttribute('aria-hidden', 'false');
  panelBackdrop.hidden = false;
}

function closeProfilePanel() {
  profilePanel.classList.remove('open');
  profilePanel.setAttribute('aria-hidden', 'true');
  panelBackdrop.hidden = true;
}

function setPanelView(view) {
  for (const tab of panelTabs) {
    const isActive = tab.dataset.view === view;
    tab.classList.toggle('is-active', isActive);
  }

  for (const section of panelViews) {
    const isActive = section.dataset.view === view;
    section.classList.toggle('is-active', isActive);
  }
}

async function ensureCameraReady() {
  if (stream) {
    return;
  }

  stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 60 },
    },
    audio: false,
  });

  preview.srcObject = stream;
  await preview.play();
}

async function captureFrame() {
  if (!recording || inFlight || !session) {
    return;
  }

  inFlight = true;
  try {
    const width = preview.videoWidth || 1280;
    const height = preview.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.save();
    if (settings.mirrorCorrection !== false) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(preview, 0, 0, width, height);
    ctx.restore();

    const imageData = ctx.getImageData(0, 0, width, height);
    const frameMetrics = computeFrameMetrics(imageData);
    const motionScore = computeMotionScore(imageData);
    updateFocusMetrics(motionScore, frameMetrics.detailScore);

    const motionThreshold = Number(settings.motionThreshold || 0.08);
    const shouldSave = !settings.motionTriggeredCapture || !lastMotionFrame || motionScore >= motionThreshold;
    lastMotionFrame = imageData;
    captureTick += 1;

    if (!shouldSave) {
      return;
    }

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.86);
    frameCount += 1;

    await window.studyCctvApi.saveFrame({
      framesDir: session.framesDir,
      frameNumber: frameCount,
      imageDataUrl,
    });

    setFrames(frameCount);
  } catch (error) {
    setStatus(`Capture error: ${error.message || String(error)}`);
  } finally {
    inFlight = false;
  }
}

function startLoop(intervalMs) {
  timerId = setInterval(() => {
    captureFrame();
  }, intervalMs);
}

function stopLoop() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

async function beginSessionFlow() {
  try {
    outputEl.textContent = '';
    setStatus('Starting...');

    const interval = Number(settings.intervalSeconds);
    const fps = Number(settings.outputFps);
    const tag = (tagInput.value || settings.defaultTag || 'desktop').trim();
    const name = (sessionNameInput.value || 'session').trim();

    if (!Number.isFinite(interval) || interval <= 0) {
      throw new Error('Interval must be > 0');
    }
    if (!Number.isFinite(fps) || fps <= 0) {
      throw new Error('FPS must be > 0');
    }

    await ensureCameraReady();
    session = await window.studyCctvApi.createSession({
      name,
      tag,
      outputDirectory: settings.outputDirectory || '',
    });

    frameCount = 0;
    captureTick = 0;
    lastMotionFrame = null;
    focusTimeline = [];
    focusTotalScore = 0;
    focusEngagedFrames = 0;
    setFrames(0);
    recording = true;
    stopBtn.disabled = false;
    showScreen(recordScreen);
    setStatus('Recording');

    await captureFrame();
    startLoop(Math.round(interval * 1000));
  } catch (error) {
    setStatus(`Start error: ${error.message || String(error)}`);
    showScreen(setupScreen);
  }
}

async function stopAndBuild() {
  if (!recording) {
    return;
  }

  recording = false;
  stopLoop();
  stopBtn.disabled = true;

  if (!session || frameCount < 2) {
    setStatus('Need at least 2 frames to build video');
    showScreen(homeScreen);
    return;
  }

  try {
    setStatus('Building timelapse video...');
    const fps = Number(settings.outputFps);
    const durationSeconds = Number((frameCount / fps).toFixed(2));

    const result = await window.studyCctvApi.buildVideo({
      framesDir: session.framesDir,
      outputPath: session.outputPath,
      fps,
      overlayOptions: getOverlayOptions(),
      sessionName: sessionNameInput.value || 'session',
      durationSeconds,
    });

    const thumbnailResult = await window.studyCctvApi.createThumbnail({
      outputPath: result.outputPath,
      thumbnailPath: session.thumbnailPath,
    });

    const averageFocus = focusTimeline.length ? (focusTotalScore / focusTimeline.length) : 0;
    const engagedMinutes = Number((((focusEngagedFrames * Number(settings.intervalSeconds || 1.5)) / 60)).toFixed(2));

    await window.studyCctvApi.finalizeSession({
      name: sessionNameInput.value || 'session',
      tag: tagInput.value || settings.defaultTag || 'desktop',
      intervalSeconds: Number(settings.intervalSeconds),
      fps,
      frameCount,
      thumbnailPath: thumbnailResult.thumbnailPath,
      durationSeconds,
      focusTimeline,
      focusAverage: Number(averageFocus.toFixed(3)),
      engagedMinutes,
      outputPath: result.outputPath,
      createdAt: session.createdAt,
    });

    await window.studyCctvApi.notifyBuildFinished({
      title: 'Study CCTV',
      body: `Build complete for ${sessionNameInput.value || 'session'}`,
    });

    setStatus('Done');
    outputEl.textContent = `Saved: ${result.outputPath}`;
    await refreshDashboard();
    showScreen(homeScreen);
  } catch (error) {
    setStatus(`Build error: ${error.message || String(error)}`);
  }
}

async function buildFromFramesFolderFlow() {
  if (recording || processingFromFolder) {
    return;
  }

  processingFromFolder = true;
  beginSessionBtn.disabled = true;
  buildFromFolderBtn.disabled = true;
  backHomeBtn.disabled = true;

  try {
    outputEl.textContent = '';
    setStatus('Select a folder that contains frame images...');

    const fps = Number(settings.outputFps);
    if (!Number.isFinite(fps) || fps <= 0) {
      throw new Error('FPS must be > 0');
    }

    const pickResult = await window.studyCctvApi.pickFramesDirectory();
    if (!pickResult || pickResult.canceled || !pickResult.directory) {
      setStatus('Ready');
      return;
    }

    const tag = (tagInput.value || settings.defaultTag || 'desktop').trim();
    const name = (sessionNameInput.value || 'session').trim();

    session = await window.studyCctvApi.createSession({
      name,
      tag,
      outputDirectory: settings.outputDirectory || '',
    });

    setStatus('Building timelapse video...');
    const result = await window.studyCctvApi.buildVideoFromFolder({
      framesDirectory: pickResult.directory,
      outputPath: session.outputPath,
      fps,
      overlayOptions: getOverlayOptions(),
      sessionName: name,
    });

    const thumbnailResult = await window.studyCctvApi.createThumbnail({
      outputPath: result.outputPath,
      thumbnailPath: session.thumbnailPath,
    });

    const builtFrameCount = Number(result.frameCount) || 0;
    frameCount = builtFrameCount;
    setFrames(frameCount);
    const durationSeconds = Number((builtFrameCount / fps).toFixed(2));

    await window.studyCctvApi.finalizeSession({
      name,
      tag,
      intervalSeconds: Number(settings.intervalSeconds),
      fps,
      frameCount: builtFrameCount,
      thumbnailPath: thumbnailResult.thumbnailPath,
      durationSeconds,
      focusTimeline: [],
      focusAverage: 0,
      engagedMinutes: 0,
      outputPath: result.outputPath,
      createdAt: session.createdAt,
    });

    await window.studyCctvApi.notifyBuildFinished({
      title: 'Study CCTV',
      body: `Build complete for ${name}`,
    });

    setStatus('Done');
    outputEl.textContent = `Saved: ${result.outputPath}`;
    await refreshDashboard();
    showScreen(homeScreen);
  } catch (error) {
    setStatus(`Build error: ${error.message || String(error)}`);
  } finally {
    beginSessionBtn.disabled = false;
    buildFromFolderBtn.disabled = false;
    backHomeBtn.disabled = false;
    processingFromFolder = false;
  }
}

async function saveSettings() {
  const next = {
    intervalSeconds: Number(intervalInput.value),
    outputFps: Number(fpsInput.value),
    defaultTag: defaultTagInput.value || 'desktop',
    outputDirectory: outputDirInput.value || '',
    theme: themeSelect.value || 'lumon',
    borderStyle: borderStyleSelect.value || 'full',
    cornerStyle: cornerStyleSelect.value || 'rounded',
    mirrorCorrection: Boolean(mirrorToggle.checked),
    motionTriggeredCapture: Boolean(motionCaptureToggle.checked),
    motionThreshold: Number(motionThresholdInput.value),
    overlayTimestamp: Boolean(overlayTimestampToggle.checked),
    overlaySessionName: Boolean(overlaySessionNameToggle.checked),
    overlayProgressBar: Boolean(overlayProgressBarToggle.checked),
    diskWarningGb: Number(diskWarningInput.value),
    hotkeyEnabled: Boolean(hotkeyToggle.checked),
    userName: (userNameInput.value || '').trim(),
  };

  settings = await window.studyCctvApi.saveSettings(next);
  loadSettingsToInputs();
  if (!tagInput.value.trim()) {
    tagInput.value = settings.defaultTag || 'desktop';
  }
  await refreshDiskUsage();
  closeProfilePanel();
}

async function clearAllData() {
  const accepted = window.confirm('Clear all app data, including saved stats and profile settings?');
  if (!accepted) {
    return;
  }

  await window.studyCctvApi.clearAllData();
  settings = await window.studyCctvApi.getSettings();
  await ensureUserName();
  loadSettingsToInputs();
  await refreshDashboard();
  setStatus('All data cleared');
  closeProfilePanel();
}

async function buildMonthlyDigestFlow() {
  if (recording || processingFromFolder) {
    return;
  }

  const confirmed = window.confirm('Build a digest from sessions in the last 30 days?');
  if (!confirmed) {
    return;
  }

  buildDigestBtn.disabled = true;
  try {
    setStatus('Building monthly digest...');
    const result = await window.studyCctvApi.buildMonthlyDigest({
      days: 30,
      outputDirectory: settings.outputDirectory || '',
    });

    await window.studyCctvApi.notifyBuildFinished({
      title: 'Study CCTV Digest Ready',
      body: `Digest built from ${result.sessionCount} sessions`,
    });

    outputEl.textContent = `Digest saved: ${result.outputPath}`;
    setStatus('Done');
    await refreshDashboard();
  } catch (error) {
    setStatus(`Digest error: ${error.message || String(error)}`);
  } finally {
    buildDigestBtn.disabled = false;
  }
}

async function ensureUserName() {
  if (settings.userName && String(settings.userName).trim()) {
    return;
  }

  const input = window.prompt('Welcome. What is your name?', '');
  const userName = (input || '').trim() || 'Operator';
  settings = await window.studyCctvApi.saveSettings({
    ...settings,
    userName,
  });
}

async function pickOutputDirectory() {
  const result = await window.studyCctvApi.pickOutputDirectory();
  if (!result || result.canceled) {
    return;
  }
  outputDirInput.value = result.directory;
  await refreshDiskUsage();
}

toSetupBtn.addEventListener('click', () => {
  sessionNameInput.value = '';
  tagInput.value = settings.defaultTag || 'desktop';
  showScreen(setupScreen);
});

backHomeBtn.addEventListener('click', () => {
  showScreen(homeScreen);
});

beginSessionBtn.addEventListener('click', beginSessionFlow);
buildFromFolderBtn.addEventListener('click', buildFromFramesFolderFlow);
buildDigestBtn.addEventListener('click', buildMonthlyDigestFlow);
stopBtn.addEventListener('click', stopAndBuild);

profileBtn.addEventListener('click', openProfilePanel);
closeProfileBtn.addEventListener('click', closeProfilePanel);
panelBackdrop.addEventListener('click', closeProfilePanel);
saveSettingsBtn.addEventListener('click', saveSettings);
pickOutputDirBtn.addEventListener('click', pickOutputDirectory);
clearDataBtn.addEventListener('click', clearAllData);
for (const tab of panelTabs) {
  tab.addEventListener('click', () => {
    setPanelView(tab.dataset.view || 'profile');
  });
}
themeSelect.addEventListener('change', () => {
  applyTheme(themeSelect.value || 'lumon');
});
borderStyleSelect.addEventListener('change', () => {
  applyBorderStyle(borderStyleSelect.value || 'full');
});
cornerStyleSelect.addEventListener('change', () => {
  applyCornerStyle(cornerStyleSelect.value || 'rounded');
});
mirrorToggle.addEventListener('change', () => {
  applyMirrorCorrection(Boolean(mirrorToggle.checked));
});

window.addEventListener('keydown', (event) => {
  if (settings.hotkeyEnabled === false) {
    return;
  }

  if (!event.ctrlKey || !event.shiftKey || event.code !== 'KeyR') {
    return;
  }

  event.preventDefault();

  if (recording) {
    stopAndBuild();
    return;
  }

  if (homeScreen.classList.contains('screen-active')) {
    sessionNameInput.value = '';
    tagInput.value = settings.defaultTag || 'desktop';
    showScreen(setupScreen);
  }

  if (setupScreen.classList.contains('screen-active')) {
    beginSessionFlow();
  }
});

window.addEventListener('beforeunload', () => {
  stopLoop();
  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }
});

async function boot() {
  populateThemeOptions();
  settings = await window.studyCctvApi.getSettings();
  await ensureUserName();
  setPanelView('profile');
  loadSettingsToInputs();
  await refreshDashboard();
  setStatus('Ready');
  setFrames(0);
  showScreen(homeScreen);
}

boot().catch((error) => {
  setStatus(`Init error: ${error.message || String(error)}`);
});
