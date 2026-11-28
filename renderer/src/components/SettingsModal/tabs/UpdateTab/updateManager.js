// src/utils/updateManager.js
// アップデート管理のユーティリティ関数

/**
 * アップデート情報を取得
 * @returns {Promise<Object|null>} アップデート情報、またはnull
 */
export async function getUpdateInfo() {
  try {
    const result = await window.electronAPI.getUpdateDebugInfo()
    if (result.success) {
      return result.data
    } else {
      console.error("❌ アップデート情報取得エラー:", result.error)
      return null
    }
  } catch (err) {
    console.error("❌ アップデート情報取得中にエラー:", err)
    return null
  }
}

/**
 * 手動でアップデートチェック
 * @returns {Promise<Object|null>} チェック結果、またはnull
 */
export async function checkForUpdates() {
  try {
    void 0
    const result = await window.electronAPI.checkForUpdates()
    if (result.success) {
      void 0
      return result.data
    } else {
      console.error("❌ 手動アップデートチェックエラー:", result.error)
      return null
    }
  } catch (err) {
    console.error("❌ 手動アップデートチェック中にエラー:", err)
    return null
  }
}

/**
 * アップデート情報をコンソールに表示
 * @param {Object} debugInfo - アップデート情報
 */
export function displayUpdateInfo(debugInfo) {
  if (!debugInfo) {
    void 0
    return
  }

  void 0
  void 0
  void 0
  void 0
  void 0
  void 0
  if (debugInfo.newVersion) {
    void 0
  }
  void 0
  if (debugInfo.lastError) {
    void 0
  }
  void 0
}

/**
 * アップデート情報をHTMLに表示
 * @param {Object} debugInfo - アップデート情報
 * @param {string} containerId - コンテナのID（デフォルト: "updateInfo"）
 */
export function displayInHTML(debugInfo, containerId = "updateInfo") {
  const container = document.getElementById(containerId)
  if (!container) {
    console.error("❌ コンテナが見つかりません:", containerId)
    return
  }

  if (!debugInfo) {
    container.innerHTML = "<p>⚠️ アップデート情報が取得されていません</p>"
    return
  }

  const html = `
    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-family: monospace;">
      <h3>🔄 アップデート情報</h3>
      <div style="margin: 10px 0;">
        <strong>📊 現在のバージョン:</strong> ${debugInfo.currentVersion}<br>
        <strong>🔍 チェック中:</strong> ${debugInfo.isChecking ? "はい" : "いいえ"}<br>
        <strong>📅 最終チェック時刻:</strong> ${debugInfo.lastCheckTime || "未実行"}<br>
        <strong>🔢 チェック回数:</strong> ${debugInfo.checkCount}<br>
        <strong>✅ アップデート利用可能:</strong> ${debugInfo.updateAvailable ? "はい" : "いいえ"}<br>
        ${debugInfo.newVersion ? `<strong>🆕 新しいバージョン:</strong> ${debugInfo.newVersion}<br>` : ""}
        <strong>📥 ダウンロード進捗:</strong> ${debugInfo.downloadProgress}%<br>
        ${debugInfo.lastError ? `<strong>❌ 最後のエラー:</strong> ${debugInfo.lastError}<br>` : ""}
      </div>
      <div style="margin-top: 10px;">
        <button onclick="window.updateManagerUtils?.checkForUpdates?.()" style="margin-right: 10px; padding: 5px 10px;">
          🔄 手動チェック
        </button>
        <button onclick="window.updateManagerUtils?.refreshUpdateInfo?.()" style="padding: 5px 10px;">
          🔄 情報更新
        </button>
      </div>
    </div>
  `

  container.innerHTML = html
}

/**
 * アップデート情報を更新してHTMLに表示
 * @param {string} containerId - コンテナのID（デフォルト: "updateInfo"）
 */
export async function refreshUpdateInfo(containerId = "updateInfo") {
  const debugInfo = await getUpdateInfo()
  displayInHTML(debugInfo, containerId)
}

// グローバルAPIとして登録（後方互換性のため）
if (typeof window !== 'undefined') {
  window.updateManagerUtils = {
    getUpdateInfo,
    checkForUpdates,
    displayUpdateInfo: (info) => displayUpdateInfo(info),
    displayInHTML: (info, containerId) => displayInHTML(info, containerId),
    refreshUpdateInfo: (containerId) => refreshUpdateInfo(containerId)
  }
}

