// preload.js
const { contextBridge, ipcRenderer } = require("electron");

console.log("[preload.bundle.cjs] start");

const { createElectronApi } = require("./electronApi");
const { createDevApi } = require("./devApi");
const { createWhisperApi } = require("./whisperApi");

const isDebugMode =
  process.argv.includes("--dev") || process.argv.includes("--debug");

contextBridge.exposeInMainWorld(
  "electronAPI",
  createElectronApi(ipcRenderer, isDebugMode)
);

contextBridge.exposeInMainWorld(
  "api",
  createDevApi(ipcRenderer)
);

contextBridge.exposeInMainWorld(
  "whisperAPI",
  createWhisperApi(ipcRenderer)
);
