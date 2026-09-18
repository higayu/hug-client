const { BrowserWindow, app } = require('electron');
const path = require('path');
const fs = require('fs');

const { resolvePreloadPath } = require('./windowManager');

let informationWindow = null;

function isDevelopmentMode() {
  const hasProdFlag =
    process.argv.includes('--prod') ||
    process.argv.includes('--production');

  const hasDevFlag =
    process.argv.includes('--dev') ||
    process.argv.includes('--debug');

  if (hasProdFlag) return false;
  if (hasDevFlag) return true;
  if (app.isPackaged) return false;

  return true;
}

async function openInformationWindow() {
  if (informationWindow && !informationWindow.isDestroyed()) {
    if (informationWindow.isMinimized()) {
      informationWindow.restore();
    }

    informationWindow.show();
    informationWindow.focus();
    return true;
  }

  const preloadPath = resolvePreloadPath();

  informationWindow = new BrowserWindow({
    width: 1100,
    height: 820,
    minWidth: 760,
    minHeight: 560,
    title: 'Q&A・障害対応',
    icon: path.join(app.getAppPath(), 'assets', 'favicon.ico'),
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  informationWindow.on('closed', () => {
    informationWindow = null;
  });

  const isDev = isDevelopmentMode();

  if (isDev) {
    await informationWindow.loadURL(
      'http://localhost:5173/?window=information',
    );
  } else {
    const rendererPath = path.join(
      app.getAppPath(),
      'renderer',
      'dist',
      'index.html',
    );

    if (!fs.existsSync(rendererPath)) {
      throw new Error(
        `renderer/dist/index.html が見つかりません: ${rendererPath}`,
      );
    }

    await informationWindow.loadFile(rendererPath, {
      query: {
        window: 'information',
      },
    });
  }

  return true;
}

function registerInformationWindow(ipcMain) {
  ipcMain.removeHandler('open-information-window');

  ipcMain.handle('open-information-window', async () => {
    try {
      await openInformationWindow();
      return {
        success: true,
      };
    } catch (error) {
      console.error('[InformationWindow] 起動エラー:', error);
      return {
        success: false,
        error: error?.message || String(error),
      };
    }
  });
}

module.exports = {
  registerInformationWindow,
  openInformationWindow,
};
