const { BrowserWindow, app, session } = require('electron');
const path = require('path');
const fs = require('fs');

const { resolvePreloadPath } = require('./windowManager');

let phpMyAdminWindow = null;
let authenticationHandlerRegistered = false;
let pendingAuthenticationCallback = null;
const PHP_MY_ADMIN_PARTITION = 'persist:php-my-admin';

function registerAuthenticationHandler() {
  if (authenticationHandlerRegistered) return;
  authenticationHandlerRegistered = true;

  app.on('login', (
    event,
    webContents,
    _authenticationResponseDetails,
    _authInfo,
    callback,
  ) => {
    const phpMyAdminSession = session.fromPartition(PHP_MY_ADMIN_PARTITION);
    if (webContents.session !== phpMyAdminSession) return;
    event.preventDefault();

    if (typeof callback !== 'function') {
      console.error('[PhpMyAdminWindow] Basic認証コールバックを取得できませんでした。');
      return;
    }

    if (pendingAuthenticationCallback) pendingAuthenticationCallback();
    pendingAuthenticationCallback = callback;

    phpMyAdminWindow?.webContents.send('php-my-admin-auth-request', {
      host: _authInfo?.host || _authenticationResponseDetails?.url || '',
    });
  });
}

function isDevelopmentMode() {
  if (process.argv.includes('--prod') || process.argv.includes('--production')) {
    return false;
  }

  if (process.argv.includes('--dev') || process.argv.includes('--debug')) {
    return true;
  }

  return !app.isPackaged;
}

async function openPhpMyAdminWindow() {
  if (pendingAuthenticationCallback) pendingAuthenticationCallback();
  pendingAuthenticationCallback = null;

  if (phpMyAdminWindow && !phpMyAdminWindow.isDestroyed()) {
    if (phpMyAdminWindow.isMinimized()) phpMyAdminWindow.restore();
    phpMyAdminWindow.show();
    phpMyAdminWindow.focus();
    phpMyAdminWindow.webContents.reloadIgnoringCache();
    return true;
  }

  phpMyAdminWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'phpMyAdmin',
    icon: path.join(app.getAppPath(), 'assets', 'favicon.ico'),
    webPreferences: {
      preload: resolvePreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      sandbox: false,
    },
  });

  phpMyAdminWindow.on('closed', () => {
    if (pendingAuthenticationCallback) pendingAuthenticationCallback();
    pendingAuthenticationCallback = null;
    phpMyAdminWindow = null;
  });

  if (isDevelopmentMode()) {
    await phpMyAdminWindow.loadURL('http://localhost:5173/?window=phpMyAdmin');
    return true;
  }

  const rendererPath = path.join(
    app.getAppPath(),
    'renderer',
    'dist',
    'index.html',
  );

  if (!fs.existsSync(rendererPath)) {
    throw new Error(`renderer/dist/index.html が見つかりません: ${rendererPath}`);
  }

  await phpMyAdminWindow.loadFile(rendererPath, {
    query: { window: 'phpMyAdmin' },
  });

  return true;
}

function registerPhpMyAdminWindow(ipcMain) {
  registerAuthenticationHandler();
  ipcMain.removeHandler('open-php-my-admin-window');
  ipcMain.removeHandler('respond-php-my-admin-auth');

  ipcMain.handle('respond-php-my-admin-auth', (_event, response) => {
    if (!pendingAuthenticationCallback) {
      return { success: false, error: '認証要求の有効期限が切れています。' };
    }

    const callback = pendingAuthenticationCallback;
    pendingAuthenticationCallback = null;

    if (response?.cancelled) {
      callback();
      return { success: true };
    }

    const username = String(response?.username ?? '').trim();
    const password = String(response?.password ?? '');
    if (!username || !password) {
      pendingAuthenticationCallback = callback;
      return { success: false, error: 'ユーザー名とパスワードを入力してください。' };
    }

    callback(username, password);
    return { success: true };
  });

  ipcMain.handle('open-php-my-admin-window', async () => {
    try {
      await openPhpMyAdminWindow();
      return { success: true };
    } catch (error) {
      console.error('[PhpMyAdminWindow] 起動エラー:', error);
      return { success: false, error: error?.message || String(error) };
    }
  });
}

module.exports = { registerPhpMyAdminWindow, openPhpMyAdminWindow };
