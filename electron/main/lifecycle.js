// main/lifecycle.js
const { app } = require("electron");

function registerAppLifecycleHandlers() {
  app.on("before-quit", () => {
    console.log("application start");
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