const { BrowserWindow } = require("electron");

function registerPrintPreview(ipcMain) {
  ipcMain.handle("open-print-preview", async (event, args = {}) => {
    const {
      title = "印刷プレビュー",
      html = "",
    } = args;

    const parentWindow = BrowserWindow.fromWebContents(event.sender);

    const previewWindow = new BrowserWindow({
      width: 1100,
      height: 900,
      parent: parentWindow ?? undefined,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const previewHtml = `
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">

<title>${escapeHtml(title)}</title>

<style>
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background: #e5e7eb;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      "Yu Gothic",
      "Meiryo",
      sans-serif;
    color: #111827;
  }

  .preview-toolbar {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 20px;
    background: #ffffff;
    border-bottom: 1px solid #d1d5db;
  }

  .preview-toolbar button {
    border: 0;
    border-radius: 6px;
    padding: 9px 18px;
    cursor: pointer;
    font-size: 14px;
  }

  .print-button {
    background: #2563eb;
    color: white;
  }

  .close-button {
    background: #e5e7eb;
    color: #374151;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 20px auto;
    padding: 12mm;
    background: white;
    box-shadow: 0 2px 12px rgba(0,0,0,.18);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  th,
  td {
    border: 1px solid #999;
    padding: 5px;
    vertical-align: top;
  }

  th {
    background: #f3f4f6;
  }

  h1 {
    font-size: 20px;
    margin: 0 0 15px;
  }

  h2,
  h3 {
    break-after: avoid;
  }

  @page {
    size: A4;
    margin: 10mm;
  }

  @media print {
    body {
      background: white;
    }

    .preview-toolbar {
      display: none;
    }

    .page {
      width: auto;
      min-height: auto;
      margin: 0;
      padding: 0;
      box-shadow: none;
    }
  }
</style>
</head>

<body>

<div class="preview-toolbar">
  <button
    class="close-button"
    onclick="window.close()"
  >
    閉じる
  </button>

  <button
    class="print-button"
    onclick="window.print()"
  >
    🖨 印刷
  </button>
</div>

<div class="page">
  <h1>${escapeHtml(title)}</h1>

  ${html}
</div>

</body>
</html>
`;

    const dataUrl =
      `data:text/html;charset=UTF-8,${encodeURIComponent(previewHtml)}`;

    await previewWindow.loadURL(dataUrl);

    return {
      success: true,
    };
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

module.exports = {
  registerPrintPreview,
};