// main/whisperTranscriber.js
const { app, ipcMain, dialog, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const { spawn } = require("child_process");

/**
 * 放課後等デイサービス向け initial prompt
 * whisper.cpp の --prompt に渡す
 */
const INITIAL_PROMPT = [
  "これは放課後等デイサービスでの日本語会話です。",
  "支援員と児童のやり取り、活動中の声かけ、課題、自由時間、個別支援、療育に関する会話が含まれます。",
  "児童の発言と支援員の声かけを、できるだけ聞こえた通りに文字起こししてください。",
  "不明瞭な部分は無理に補わず、自然な日本語として書き起こしてください。",
].join(" ");

/**
 * 存在するファイルパスを候補から探す
 */
function findExistingPath(candidates) {
  return candidates.find((filePath) => fs.existsSync(filePath));
}

/**
 * 開発時 / ビルド後で whisper.cpp の場所を切り替える
 *
 * 開発時:
 *   プロジェクト直下の whisper.cpp を参照
 *
 * ビルド後:
 *   dist/win-unpacked/resources/whisper.cpp を参照
 */
function getWhisperDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "whisper.cpp");
  }

  return path.join(__dirname, "..", "..", "whisper.cpp");
}

/**
 * whisper-cli.exe のパスを取得
 */
function getWhisperCliPath() {
  const whisperDir = getWhisperDir();

  const exeCandidates = [
    // Windows Release build
    path.join(
      whisperDir,
      "build",
      "bin",
      "Release",
      "whisper-cli.exe"
    ),

    // 念のため Release が無い構成にも対応
    path.join(
      whisperDir,
      "build",
      "bin",
      "whisper-cli.exe"
    ),

    // 古い whisper.cpp では main.exe の場合があるため保険
    path.join(
      whisperDir,
      "build",
      "bin",
      "Release",
      "main.exe"
    ),

    path.join(
      whisperDir,
      "build",
      "bin",
      "main.exe"
    ),
  ];

  const exePath = findExistingPath(exeCandidates);

  if (!exePath) {
    throw new Error(
      [
        "whisper-cli.exe が見つかりません。",
        "",
        "確認した場所:",
        ...exeCandidates,
        "",
        app.isPackaged
          ? "ビルド後は package.json の build.extraResources で whisper.cpp/build/bin を resources 配下へコピーしてください。"
          : "開発中は whisper.cpp をビルドして build/bin/Release/whisper-cli.exe を作成してください。",
      ].join("\n")
    );
  }

  return exePath;
}

/**
 * whisper.cpp のモデルファイルパスを取得
 */
function getWhisperModelPath() {
  const whisperDir = getWhisperDir();

  const modelCandidates = [
    path.join(whisperDir, "models", "ggml-small.bin"),
    path.join(whisperDir, "models", "ggml-base.bin"),
    path.join(whisperDir, "models", "ggml-medium.bin"),
    path.join(whisperDir, "ggml-small.bin"),
    path.join(whisperDir, "ggml-base.bin"),
    path.join(whisperDir, "ggml-medium.bin"),
  ];

  const modelPath = findExistingPath(modelCandidates);

  if (!modelPath) {
    throw new Error(
      [
        "モデルファイルが見つかりません。",
        "",
        "確認した場所:",
        ...modelCandidates,
        "",
        "例: whisper.cpp/models/ggml-small.bin",
        "",
        "ビルド後に使う場合は package.json の build.extraResources で whisper.cpp/models もコピーしてください。",
      ].join("\n")
    );
  }

  return modelPath;
}

/**
 * ArrayBuffer / Uint8Array / Buffer を Buffer に変換
 */
function toBuffer(audioArrayBuffer) {
  if (!audioArrayBuffer) {
    throw new Error("音声データが空です。");
  }

  if (Buffer.isBuffer(audioArrayBuffer)) {
    return audioArrayBuffer;
  }

  if (audioArrayBuffer instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(audioArrayBuffer));
  }

  if (ArrayBuffer.isView(audioArrayBuffer)) {
    return Buffer.from(
      audioArrayBuffer.buffer,
      audioArrayBuffer.byteOffset,
      audioArrayBuffer.byteLength
    );
  }

  throw new Error("対応していない音声データ形式です。");
}

/**
 * 保存ダイアログの初期ファイル名
 */
function defaultRecordingWavName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");

  return `recording-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(
    d.getDate()
  )}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(
    d.getSeconds()
  )}.wav`;
}

/**
 * 一時ファイル削除
 */
function cleanupTempFiles(...filePaths) {
  for (const filePath of filePaths) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      // 一時ファイル削除失敗は無視
    }
  }
}

/**
 * whisper.cpp を使って wav 音声を文字起こしする
 *
 * @param {ArrayBuffer | Uint8Array | Buffer} audioArrayBuffer
 * @param {object} [options]
 * @param {string} [options.wavPath] 入力 wav の保存先パス
 * @param {boolean} [options.deleteWavAfter=true] 文字起こし後に入力 wav を削除するか
 * @returns {Promise<string>}
 */
function transcribeWithWhisper(audioArrayBuffer, options = {}) {
  const { wavPath: providedWavPath, deleteWavAfter = true } = options;

  const exePath = getWhisperCliPath();
  const modelPath = getWhisperModelPath();

  const tempDir = path.join(os.tmpdir(), "hug-whisper");
  fs.mkdirSync(tempDir, { recursive: true });

  const uniqueId = `${Date.now()}-${process.pid}-${crypto
    .randomBytes(6)
    .toString("hex")}`;

  const baseName = `audio-${uniqueId}`;

  const wavPath =
    providedWavPath || path.join(tempDir, `${baseName}.wav`);

  const outputBasePath = path.join(tempDir, `${baseName}-result`);
  const outputTxtPath = `${outputBasePath}.txt`;

  const audioBuffer = toBuffer(audioArrayBuffer);

  const wavDir = path.dirname(wavPath);
  fs.mkdirSync(wavDir, { recursive: true });

  fs.writeFileSync(wavPath, audioBuffer);

  const shouldDeleteWav = !providedWavPath && deleteWavAfter;

  return new Promise((resolve, reject) => {
    const args = [
      "-m",
      modelPath,

      "-f",
      wavPath,

      // 日本語として認識
      "-l",
      "ja",

      // タイムスタンプなし
      "-nt",

      // 放課後等デイサービス向けプロンプト
      "--prompt",
      INITIAL_PROMPT,

      // txt 出力
      "-otxt",
      "-of",
      outputBasePath,
    ];

    const child = spawn(exePath, args, {
      windowsHide: true,

      // 重要:
      // whisper.dll / ggml.dll などを同じフォルダから読めるようにする
      cwd: path.dirname(exePath),
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString("utf8");
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString("utf8");
    });

    child.on("error", (err) => {
      cleanupTempFiles(
        shouldDeleteWav ? wavPath : null,
        outputTxtPath
      );

      reject(
        new Error(
          [
            "whisper-cli.exe の起動に失敗しました。",
            "",
            `exePath: ${exePath}`,
            `cwd: ${path.dirname(exePath)}`,
            "",
            err.message,
          ].join("\n")
        )
      );
    });

    child.on("close", (code) => {
      try {
        if (code !== 0) {
          cleanupTempFiles(
            shouldDeleteWav ? wavPath : null,
            outputTxtPath
          );

          reject(
            new Error(
              [
                `whisper-cli.exe が異常終了しました。code: ${code}`,
                "",
                `exePath: ${exePath}`,
                `modelPath: ${modelPath}`,
                `wavPath: ${wavPath}`,
                "",
                "stdout:",
                stdout,
                "",
                "stderr:",
                stderr,
              ].join("\n")
            )
          );
          return;
        }

        if (!fs.existsSync(outputTxtPath)) {
          cleanupTempFiles(
            shouldDeleteWav ? wavPath : null,
            outputTxtPath
          );

          reject(
            new Error(
              [
                `文字起こし結果ファイルが作成されませんでした: ${outputTxtPath}`,
                "",
                `exePath: ${exePath}`,
                `modelPath: ${modelPath}`,
                `wavPath: ${wavPath}`,
                "",
                "stdout:",
                stdout,
                "",
                "stderr:",
                stderr,
              ].join("\n")
            )
          );
          return;
        }

        const resultText = fs.readFileSync(outputTxtPath, "utf8").trim();

        cleanupTempFiles(
          shouldDeleteWav ? wavPath : null,
          outputTxtPath
        );

        resolve(resultText);
      } catch (e) {
        cleanupTempFiles(
          shouldDeleteWav ? wavPath : null,
          outputTxtPath
        );

        reject(e);
      }
    });
  });
}

/**
 * IPC登録
 */
function registerWhisperTranscriber() {
  ipcMain.handle(
    "whisper:transcribe",
    async (event, audioArrayBuffer, transcribeOptions = {}) => {
      const { saveAudioBeforeTranscribe = false } = transcribeOptions;

      if (!saveAudioBeforeTranscribe) {
        return await transcribeWithWhisper(audioArrayBuffer, {
          deleteWavAfter: true,
        });
      }

      const parentWindow = BrowserWindow.fromWebContents(event.sender);

      const { canceled, filePath } = await dialog.showSaveDialog(
        parentWindow,
        {
          title: "録音音声を保存",
          defaultPath: defaultRecordingWavName(),
          filters: [
            {
              name: "WAV 音声",
              extensions: ["wav"],
            },
          ],
        }
      );

      if (canceled || !filePath) {
        throw new Error("音声の保存がキャンセルされました。");
      }

      return await transcribeWithWhisper(audioArrayBuffer, {
        wavPath: filePath,
        deleteWavAfter: false,
      });
    }
  );
}

module.exports = {
  registerWhisperTranscriber,
  transcribeWithWhisper,
};
