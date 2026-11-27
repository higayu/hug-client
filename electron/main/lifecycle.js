// main/lifecycle.js
const { app } = require("electron");

function registerAppLifecycleHandlers() {
  app.on("before-quit", () => {
    void 0;
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

module.exports = {
  registerAppLifecycleHandlers,
};