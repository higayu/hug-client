const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const SCRIPT_NAME = "resolveHugPlan.ps1";

function getRunnableScriptPath() {
  const sourcePath = path.join(__dirname, SCRIPT_NAME);
  if (!app.isPackaged) return sourcePath;
  const targetDir = path.join(app.getPath("userData"), "scripts");
  const targetPath = path.join(targetDir, SCRIPT_NAME);
  const source = fs.readFileSync(sourcePath);
  fs.mkdirSync(targetDir, { recursive: true });
  if (!fs.existsSync(targetPath) || !fs.readFileSync(targetPath).equals(source)) {
    fs.writeFileSync(targetPath, source);
  }
  return targetPath;
}

function runHugPlanResolver(payload) {
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      getRunnableScriptPath(),
    ], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code !== 0 && !stdout.trim()) {
        reject(
          new Error(
            `PowerShell実行失敗 (終了コード: ${code})${
              stderr.trim() ? `: ${stderr.trim()}` : ""
            }`
          )
        );
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());

        // ----------------------------------------
        // 検索結果URLをConsoleへ出力
        // ----------------------------------------
        if (result.targetUrl) {
          const label =
            payload.pageType === "specialized"
              ? "専門的支援計画"
              : "個別支援計画";

          console.log(
            `[HUG ${label}] 検索結果URL:`,
            result.targetUrl
          );
        }

        resolve(result);
      } catch (_error) {
        reject(
          new Error(
            `PowerShellの応答を解析できませんでした (終了コード: ${code})`
          )
        );
      }
    });

    // Cookie and credentials never appear in the process command line.
    child.stdin.end(JSON.stringify(payload), "utf8");
  });
}

module.exports = { runHugPlanResolver };

