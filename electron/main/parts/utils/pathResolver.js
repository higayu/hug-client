// main/parts/utils/pathResolver.js
const path = require("path");
const { app } = require("electron");

function getDataDir() {
  return app.isPackaged
    ? path.join(app.getPath("userData"), "data")
    : path.join(__dirname, "../../../data");
}

function getConfigPath() {
  return path.join(getDataDir(), "config.json");
}

function getIniPath() {
  return path.join(getDataDir(), "ini.json");
}

function getDbPath() {
  return path.join(getDataDir(), "houday.db");
}

module.exports = {
  getDataDir,
  getConfigPath,
  getIniPath,
  getDbPath,
};
