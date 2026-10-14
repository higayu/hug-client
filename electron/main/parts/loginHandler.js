// main/parts/loginHandler.js
const { loginHug } = require("../../../puppeteer/login");

function handleLogin(ipcMain, mainWindow) {
  ipcMain.handle("hug-login", async () => {
    try {
      const page = await loginHug();
      const cookies = await page.cookies();

      const { session } = mainWindow.webContents;
      for (const cookie of cookies) {
        await session.cookies.set({
          url: "https://www.hug-ayumu.link",
          name: cookie.name,
          value: cookie.value,
          domain: "www.hug-ayumu.link",
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
        });
      }

      mainWindow.loadURL("https://www.hug-ayumu.link/hug/wm/");
      return { success: true };
    } catch (err) {
      console.error("ログイン処理失敗:", err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("do-auto-login", async (event, { username, password }) => {
    mainWindow.webContents.send("inject-login", { username, password });
    return { success: true };
  });
}

module.exports = { handleLogin };
