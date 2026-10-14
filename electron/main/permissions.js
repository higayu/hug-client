// main/permissions.js
const { session } = require("electron");

/**
 * WebView / BrowserWindow で使用する権限を設定する
 */
function setupMediaPermissions() {
  /**
   * 権限要求時
   */
  session.defaultSession.setPermissionRequestHandler(
    (
      webContents,
      permission,
      callback,
      details
    ) => {
      const requestingUrl =
        details?.requestingUrl ||
        details?.embeddingOrigin ||
        webContents?.getURL?.() ||
        "";

      console.log(
        "[PermissionRequest]",
        {
          permission,
          requestingUrl,
        }
      );

      // ==========================================
      // マイク / メディア
      // ==========================================
      if (
        permission === "media" ||
        permission === "microphone"
      ) {
        console.log(
          "[PermissionRequest] allowed:",
          permission
        );

        callback(true);
        return;
      }

      // ==========================================
      // Clipboard 書き込み
      // 全サイト許可
      // ==========================================
      if (
        permission ===
        "clipboard-sanitized-write"
      ) {
        console.log(
          "[PermissionRequest] clipboard write: allowed",
          requestingUrl
        );

        callback(true);
        return;
      }

      // ==========================================
      // Clipboard 読み込み
      // 全サイト許可
      // ==========================================
      if (
        permission === "clipboard-read"
      ) {
        console.log(
          "[PermissionRequest] clipboard read: allowed",
          requestingUrl
        );

        callback(true);
        return;
      }

      // ==========================================
      // その他は拒否
      // ==========================================
      console.warn(
        "[PermissionRequest] denied:",
        permission,
        requestingUrl
      );

      callback(false);
    }
  );

  /**
   * 権限チェック時
   */
  session.defaultSession.setPermissionCheckHandler(
    (
      webContents,
      permission,
      requestingOrigin,
      details
    ) => {
      const origin =
        requestingOrigin ||
        details?.requestingUrl ||
        details?.embeddingOrigin ||
        webContents?.getURL?.() ||
        "";

      console.log(
        "[PermissionCheck]",
        {
          permission,
          origin,
        }
      );

      // ==========================================
      // マイク / メディア
      // ==========================================
      if (
        permission === "media" ||
        permission === "microphone"
      ) {
        console.log(
          "[PermissionCheck] allowed:",
          permission
        );

        return true;
      }

      // ==========================================
      // Clipboard 書き込み
      // 全サイト許可
      // ==========================================
      if (
        permission ===
        "clipboard-sanitized-write"
      ) {
        console.log(
          "[PermissionCheck] clipboard write: allowed",
          origin
        );

        return true;
      }

      // ==========================================
      // Clipboard 読み込み
      // 全サイト許可
      // ==========================================
      if (
        permission === "clipboard-read"
      ) {
        console.log(
          "[PermissionCheck] clipboard read: allowed",
          origin
        );

        return true;
      }

      // ==========================================
      // その他は拒否
      // ==========================================
      console.warn(
        "[PermissionCheck] denied:",
        permission,
        origin
      );

      return false;
    }
  );
}

module.exports = {
  setupMediaPermissions,
};

