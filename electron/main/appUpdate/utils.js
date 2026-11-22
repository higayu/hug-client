function removeHandlerIfRegistered(ipcMain, channel) {
  try {
    ipcMain.removeHandler(channel);
  } catch (_) {
    // 未登録なら何もしない。
  }
}

function notifyDownloadProgress(event, payload) {
  try {
    if (!event?.sender || event.sender.isDestroyed()) return;
    event.sender.send('app-update:download-progress', payload);
  } catch (error) {
    console.warn('[AppUpdate] download progress send failed:', error?.message ?? error);
  }
}

function sanitizeFileName(value) {
  const name = String(value ?? '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/[. ]+$/g, '')
    .trim();
  return name || 'Hug-banso-navi-Setup.exe';
}

function parseContentDispositionFileName(headerValue) {
  if (!headerValue) return null;
  const header = String(headerValue);
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/^"|"$/g, ''));
    } catch (_) {
      return utf8Match[1].replace(/^"|"$/g, '');
    }
  }
  const normalMatch = header.match(/filename="([^"]+)"/i)
    || header.match(/filename=([^;]+)/i);
  return normalMatch?.[1] ? normalMatch[1].trim().replace(/^"|"$/g, '') : null;
}

module.exports = { removeHandlerIfRegistered, notifyDownloadProgress, sanitizeFileName, parseContentDispositionFileName };
