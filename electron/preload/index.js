// preload.js
const { contextBridge, ipcRenderer } = require("electron");

void 0;

const { createElectronApi } = require("./electronApi");
const { createDevApi } = require("./devApi");
const { createWhisperApi } = require("./whisperApi");
const { createWebviewPageSaveBridge } = require("./webviewPageSaveBridge");

const isDebugMode =
  process.argv.includes("--dev") || process.argv.includes("--debug");

contextBridge.exposeInMainWorld('offlineRecords', {
  list: (scope) => ipcRenderer.invoke('offline-records:list', scope),
  save: (record) => ipcRenderer.invoke('offline-records:save', record),
  deleteTransferred: (scope) => ipcRenderer.invoke('offline-records:deleteTransferred', scope),
});

contextBridge.exposeInMainWorld(
  "electronAPI",
  createElectronApi(ipcRenderer, isDebugMode)
);

contextBridge.exposeInMainWorld(
  "api",
  createDevApi(ipcRenderer, isDebugMode)
);

contextBridge.exposeInMainWorld(
  "whisperAPI",
  createWhisperApi(ipcRenderer)
);

contextBridge.exposeInMainWorld(
  "electronWebviewPageSave",
  createWebviewPageSaveBridge(ipcRenderer)
);
