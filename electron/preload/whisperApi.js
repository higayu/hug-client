// preload/whisperApi.js
function createWhisperApi(ipcRenderer) {
    return {
      transcribe: async (audioArrayBuffer, options = {}) => {
        return await ipcRenderer.invoke(
          "whisper:transcribe",
          audioArrayBuffer,
          options
        );
      },
    };
  }
  
  module.exports = {
    createWhisperApi,
  };