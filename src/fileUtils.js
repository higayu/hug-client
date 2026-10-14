// src/fileUtils.js
const path = require("path");
const { app } = require("electron");

/**
 * データファイルのパスを取得する関数
 * @param {...string} paths - 追加のパス要素
 * @returns {string} 完全なファイルパス
 */
function getDataPath(...paths) {
  if (app.isPackaged) {
    // ビルド後: ユーザーディレクトリ/data/...
    return path.join(app.getPath("userData"), "data", ...paths);
  } else {
    // 開発時: プロジェクト直下の data/...
    return path.join(__dirname, "..", "electron", "data", ...paths);
  }
}

module.exports = {
  getDataPath,
};
