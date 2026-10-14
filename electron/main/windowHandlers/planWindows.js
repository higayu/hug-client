const { BrowserWindow, shell, app, session } = require("electron");
const fs = require("fs");
const path = require("path");
const { getConfigPath } = require("../parts/utils/pathResolver");
const { runHugPlanResolver } = require("../shellCommand");

let isRegistered = false;

function registerPlanWindows(ipcMain) {
  if (isRegistered) return;
  isRegistered = true;
  ipcMain.on("open-specialized-support-plan", (_event, args) => openPlanInExternalBrowser("specialized", args));
  ipcMain.on("open-individual-support-plan", (_event, args) => openPlanInExternalBrowser("individual", args));
  ipcMain.on("Open_NowDayPage", (_event, { facilityId, dateStr }) => openSimpleWindow(facilityId, dateStr));
  ipcMain.on("open-web-manager-page", (_event, { url }) => openExternalPageWindow(url));
}

function readHugCredentials() {
  try {
    const config = JSON.parse(fs.readFileSync(getConfigPath(), "utf8"));
    return { username: config.HUG_USERNAME || "", password: config.HUG_PASSWORD || "" };
  } catch (_error) {
    return { username: "", password: "" };
  }
}

async function openPlanInExternalBrowser(pageType, args) {
  const label = pageType === "specialized" ? "専門的支援計画" : "個別支援計画";
  const { childId, facilityId } = typeof args === "object" && args !== null
    ? args
    : { childId: args, facilityId: null };
  if (childId === undefined || childId === null || String(childId).trim() === "") {
    console.error(`[HUG ${label}] childIdが指定されていません`);
    return;
  }
  if (pageType === "individual" && (facilityId === undefined || facilityId === null || String(facilityId).trim() === "")) {
    console.error(`[HUG ${label}] facilityIdが指定されていません`);
    return;
  }
  try {
    const hugSession = session.defaultSession;
    const cookies = await hugSession.cookies.get({ domain: "www.hug-ayumu.link" });
    console.log(`[HUG ${label}] Cookie取得件数: ${cookies.length}`);
    console.log(`[HUG ${label}] PowerShell開始・対象ページGET・児童検索開始`);
    const result = await runHugPlanResolver({
      pageType,
      childId: String(childId),
      facilityId: facilityId === undefined || facilityId === null ? "" : String(facilityId),
      cookies: cookies.map(({ name, value, path: cookiePath, secure, httpOnly }) => ({ name, value, path: cookiePath, secure, httpOnly })),
      ...readHugCredentials(),
    });
    console.log(`[HUG ${label}] セッション: ${result.loginRequired ? "再ログイン実施/必要" : "既存セッション有効"}`);
    if (!result.success) {
      console.error(`[HUG ${label}] ${result.code}: ${result.message}`);
      return;
    }
    for (const cookie of result.cookies || []) {
      await hugSession.cookies.set({
        url: "https://www.hug-ayumu.link",
        name: cookie.name,
        value: cookie.value,
        domain: "www.hug-ayumu.link",
        path: cookie.path || "/",
        secure: Boolean(cookie.secure),
        httpOnly: Boolean(cookie.httpOnly),
        ...(cookie.expires ? { expirationDate: cookie.expires } : {}),
      });
    }
    console.log(`[HUG ${label}] 検索成功・対象URL取得成功`);
    console.log(`[HUG ${label}] 検索結果URL: ${result.targetUrl}`);
    await shell.openExternal(result.targetUrl);
    console.log(`[HUG ${label}] ブラウザ起動成功`);
  } catch (error) {
    console.error(`[HUG ${label}] PowerShell実行またはブラウザ起動失敗:`, error.message);
  }
}

function createWindowOptions(title) {
  return { width: 1200, height: 900, title, webPreferences: { preload: path.join(app.getAppPath(), "electron", "preload", "preload.bundle.cjs") } };
}

function openSimpleWindow(facilityId, dateStr, label = "当日の利用画面") {
  const url = `https://www.hug-ayumu.link/hug/wm/attendance.php?mode=detail&f_id=${encodeURIComponent(facilityId)}&date=${encodeURIComponent(dateStr)}`;
  const win = new BrowserWindow(createWindowOptions(label));
  win.loadURL(url);
  win.webContents.on("console-message", (_event, _level, message) => console.log(`${message}`));
}

function openExternalPageWindow(url) {
  if (!url) { console.error("[openExternalPageWindow] url is required"); return; }
  shell.openExternal(url).catch((error) => console.error("[openExternalPageWindow] failed to open URL:", error));
}

module.exports = { registerPlanWindows };
