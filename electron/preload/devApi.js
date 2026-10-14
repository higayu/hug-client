// preload/devApi.js
function createDevApi(ipcRenderer) {
    return {
      openDevTools: () => ipcRenderer.invoke("open-devtools"),
      minimizeWindow: () => ipcRenderer.invoke("window:minimize"),
      toggleMaximizeWindow: () => ipcRenderer.invoke("window:toggle-maximize"),
      reloadWindow: () => ipcRenderer.invoke("window:reload"),
      quitApp: () => ipcRenderer.invoke("app:quit"),
    };
  }
  
  module.exports = {
    createDevApi,
  };
