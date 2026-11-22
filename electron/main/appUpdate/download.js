const { app } = require('electron');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');
const laravelApiClient = require('../../../src/laravelApiClient');
const auth = require('../parts/handlers/laravelAuthHandler/auth');
const { updateState, runtime } = require('./state');
const { notifyDownloadProgress, sanitizeFileName, parseContentDispositionFileName } = require('./utils');
const { fetchLatestVersionInfo } = require('./version');

async function downloadLatestUpdateHandler(event) {
  if (runtime.downloadInProgress) {
    return { success: false, message: 'インストーラーはすでにダウンロード中です。' };
  }
  runtime.downloadInProgress = true;
  updateState.downloadProgress = 0;
  updateState.lastError = null;
  // 前回成功したインストーラーを今回の失敗後に誤実行しない。
  runtime.lastDownloadedInstallerPath = null;
  updateState.downloadedFilePath = null;

  try {
    const result = await auth.executeAuthenticatedOperation(async () => {
      const versionInfo = await fetchLatestVersionInfo();
      if (!versionInfo?.success) {
        throw new Error(versionInfo?.message || '最新版情報を取得できませんでした。');
      }
      const expectedSha256 = String(
        versionInfo.sha256 ?? versionInfo.installer_sha256 ?? ''
      ).trim().toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(expectedSha256)) {
        throw new Error('最新版情報に有効なSHA-256がありません。');
      }

      const baseURL = String(laravelApiClient.getBaseURL()).replace(/\/+$/g, '');
      const token = laravelApiClient.getAccessToken();
      if (!token) throw new Error('ダウンロード用の認証トークンが取得できません。');

      // 現行のLaravel APIとの互換性を維持。将来的にはバージョンIDを固定するAPIが望ましい。
      const downloadURL = `${baseURL}/app/download/latest`;
      console.log('[AppUpdate] Download starting:', {
        latestVersion: versionInfo.latest_version,
        expectedSha256,
        downloadURL,
      });

      const response = await axios.get(downloadURL, {
        responseType: 'stream',
        timeout: 0,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        proxy: false,
        // サーバーに圧縮しないよう要求する。予期せぬ圧縮が返った場合、
        // Axiosの展開動作により保存されるバイト列が元ファイルと一致するか検証する。
        headers: {
          Accept: 'application/octet-stream',
          'Accept-Encoding': 'identity',
          Authorization: `Bearer ${token}`,
        },
        validateStatus: status => status >= 200 && status < 300,
      });

      const headers = response.headers ?? {};
      const contentDisposition = headers['content-disposition'];
      const headerFileName = parseContentDispositionFileName(contentDisposition);
      const fallbackName = `Hug banso-navi Setup ${versionInfo.latest_version || 'latest'}.exe`;
      const fileName = sanitizeFileName(headerFileName || fallbackName);
      const downloadDirectory = app.getPath('downloads');
      const finalPath = path.join(downloadDirectory, fileName);
      const partialPath = `${finalPath}.part`;
      const rawContentLength = Number(headers['content-length'] || 0);
      const total = Number.isFinite(rawContentLength) && rawContentLength > 0 ? rawContentLength : 0;
      let transferred = 0;
      let lastPercent = 0;
      const sha256 = crypto.createHash('sha256');
      fs.mkdirSync(downloadDirectory, { recursive: true });

      const progressStream = new Transform({
        transform(chunk, _encoding, callback) {
          transferred += chunk.length;
          sha256.update(chunk);
          const percent = total > 0 ? Math.min(99, (transferred / total) * 100) : 0;
          if (percent >= lastPercent + 0.5 || (total && transferred >= total)) {
            lastPercent = percent;
            updateState.downloadProgress = percent;
            notifyDownloadProgress(event, { percent, transferred, total });
          }
          callback(null, chunk);
        },
      });

      try {
        // 途中まで残ったファイルが混ざらないよう、毎回新しく生成する。
        await pipeline(response.data, progressStream, fs.createWriteStream(partialPath, { flags: 'w' }));

        const actualSha256 = sha256.digest('hex').toLowerCase();
        const fileSignature = Buffer.alloc(2);
        const fileHandle = fs.openSync(partialPath, 'r');
        try {
          fs.readSync(fileHandle, fileSignature, 0, 2, 0);
        } finally {
          fs.closeSync(fileHandle);
        }
        const isWindowsExecutable = fileSignature.toString('ascii') === 'MZ';

        console.log('[AppUpdate] Installer verification:', {
          latestVersion: versionInfo.latest_version,
          expectedSha256,
          actualSha256,
          match: actualSha256 === expectedSha256,
          transferred,
          contentLength: headers['content-length'] ?? null,
          contentType: headers['content-type'] ?? null,
          contentEncoding: headers['content-encoding'] ?? null,
          fileSignature: fileSignature.toString('hex'),
          filenameFromResponse: headerFileName ?? null,
        });

        if (!isWindowsExecutable) {
          throw new Error('ダウンロード内容がWindowsインストーラーではありません。HTMLエラーページや別形式のファイルが配信されている可能性があります。');
        }
        if (actualSha256 !== expectedSha256) {
          // 調査目的でのみ不一致ファイルを残す。拡張子を .exe にせず、
          // 更新のインストール処理にも登録しない。
          // 既存の調査用ファイルを上書きしないようタイムスタンプを付与する。
          const diagnosticName = `${fileName}.${Date.now()}.sha256-failed`;
          const diagnosticPath = path.join(downloadDirectory, diagnosticName);
          fs.renameSync(partialPath, diagnosticPath);
          console.error('[AppUpdate] SHA-256 mismatch; file retained for diagnostics:', {
            diagnosticPath,
            latestVersion: versionInfo.latest_version,
            expectedSha256,
            actualSha256,
            transferred,
            fileSize: fs.statSync(diagnosticPath).size,
            contentLength: headers['content-length'] ?? null,
            contentEncoding: headers['content-encoding'] ?? null,
            contentType: headers['content-type'] ?? null,
          });
          throw new Error(
            `ダウンロードしたインストーラーのSHA-256が一致しません。調査用ファイル: ${diagnosticPath} / 期待値: ${expectedSha256} / 実測値: ${actualSha256}。このファイルは実行しないでください。`
          );
        }

        // 検証成功までは既存の最終ファイルを上書きしない。
        if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
        fs.renameSync(partialPath, finalPath);
        runtime.lastDownloadedInstallerPath = finalPath;
        updateState.downloadedFilePath = finalPath;
        updateState.downloadProgress = 100;
        notifyDownloadProgress(event, { percent: 100, transferred, total: total || transferred });
        return {
          success: true,
          message: 'インストーラーのダウンロードが完了しました。',
          filePath: finalPath,
          fileName,
          latest_version: versionInfo.latest_version ?? null,
          sha256: actualSha256,
        };
      } catch (error) {
        try {
          if (fs.existsSync(partialPath)) fs.unlinkSync(partialPath);
        } catch (cleanupError) {
          console.warn('[AppUpdate] Partial file cleanup failed:', cleanupError?.message);
        }
        throw error;
      }
    }, 'インストーラーのダウンロードに失敗しました。');

    if (!result?.success) {
      updateState.lastError = result?.message || 'インストーラーのダウンロードに失敗しました。';
    }
    return result;
  } catch (error) {
    updateState.lastError = error?.message || 'インストーラーのダウンロードに失敗しました。';
    console.error('[AppUpdate] Download failed:', updateState.lastError);
    return auth.formatError(error, 'インストーラーのダウンロードに失敗しました。');
  } finally {
    runtime.downloadInProgress = false;
  }
}

module.exports = { downloadLatestUpdateHandler };
