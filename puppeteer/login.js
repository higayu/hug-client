const puppeteer = require("puppeteer");
require("dotenv").config(); // ← ここで.env読み込み

async function loginHug() {
  const username = process.env.HUG_USERNAME;
  const password = process.env.HUG_PASSWORD;

  if (!username || !password) {
    throw new Error("HUG_USERNAME or HUG_PASSWORD not set in .env");
  }

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://www.hug-ayumu.link/hug/wm/", { waitUntil: "networkidle2" });

  await page.type('input[name="username"]', username);
  await page.type('input[name="password"]', password);

  // 「ブラウザを閉じてもログアウトしない」をチェック
  const checkbox = await page.$('input[name="setexpire"]');
  if (checkbox) {
    const isChecked = await (await checkbox.getProperty("checked")).jsonValue();
    if (!isChecked) await checkbox.click();
  }

  // ログインボタンクリック
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click("input.btn-login"),
  ]);

  void 0;
  return page;
}

module.exports = { loginHug };
