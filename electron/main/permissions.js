// main/permissions.js
const { session } = require("electron");

function setupMediaPermissions() {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      // コピー・貼り付けで使う Clipboard API の読み書きを許可する。
      if (
        permission === "media" ||
        permission === "microphone" ||
        permission === "clipboard-sanitized-write" ||
        permission === "clipboard-read"
      ) {
        callback(true);
        return;
      }

      callback(false);
    }
  );

  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission) => {
      if (
        permission === "media" ||
        permission === "microphone" ||
        permission === "clipboard-sanitized-write" ||
        permission === "clipboard-read"
      ) {
        return true;
      }

      return false;
    }
  );
}

module.exports = {
  setupMediaPermissions,
};
