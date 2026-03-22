const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('studyCctvApi', {
  getDashboard: () => ipcRenderer.invoke('data:getDashboard'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (payload) => ipcRenderer.invoke('settings:save', payload),
  pickOutputDirectory: () => ipcRenderer.invoke('settings:pickOutputDirectory'),
  pickFramesDirectory: () => ipcRenderer.invoke('settings:pickFramesDirectory'),
  clearAllData: () => ipcRenderer.invoke('data:clearAll'),
  getDiskUsage: (payload) => ipcRenderer.invoke('data:getDiskUsage', payload),
  createSession: (payload) => ipcRenderer.invoke('session:create', payload),
  saveFrame: (payload) => ipcRenderer.invoke('session:saveFrame', payload),
  buildVideo: (payload) => ipcRenderer.invoke('session:buildVideo', payload),
  buildVideoFromFolder: (payload) => ipcRenderer.invoke('session:buildVideoFromFolder', payload),
  createThumbnail: (payload) => ipcRenderer.invoke('session:createThumbnail', payload),
  finalizeSession: (payload) => ipcRenderer.invoke('session:finalize', payload),
  buildMonthlyDigest: (payload) => ipcRenderer.invoke('digest:buildMonthly', payload),
  notifyBuildFinished: (payload) => ipcRenderer.invoke('notify:buildFinished', payload),
});
