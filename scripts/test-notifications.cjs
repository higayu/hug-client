const { build } = require('esbuild')
const puppeteer = require('puppeteer')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const assert = require('node:assert/strict')

async function main() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'hug-toast-'))
  let browser
  try {
    await build({
      stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
        import AppToaster from './renderer/src/components/common/AppToaster.jsx';
        import * as api from './renderer/src/utils/notifications.jsx';
        window.api = api; window.closeCount = 0;
        createRoot(document.getElementById('root')).render(<React.StrictMode><AppToaster /></React.StrictMode>);`,
        resolveDir: process.cwd(), loader: 'jsx' },
      bundle: true, jsx: 'automatic', outfile: path.join(dir, 'test.js'),
      alias: { '@': path.resolve('renderer/src') },
      define: { 'process.env.NODE_ENV': '"production"' },
    })
    await fs.writeFile(path.join(dir, 'index.html'), '<link rel="stylesheet" href="test.css"><div id="modal" style="position:fixed;inset:0;z-index:10000010;background:#ddd"></div><div id="root"></div><script src="test.js"></script>')
    browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(require('node:url').pathToFileURL(path.join(dir, 'index.html')).href)
    await page.waitForFunction(() => window.showToast)
    await page.evaluate(() => {
      for (const type of ['success', 'error', 'warning', 'info']) {
        api.showToast({ title: type, message: '本文\n改行', details: ['詳細1', null, '', '詳細2'], type, duration: Infinity })
      }
    })
    await page.waitForFunction(() => document.querySelectorAll('[data-sonner-toast]').length === 4)
    assert.deepEqual(await page.$$eval('[data-sonner-toast]', els => els.map(el => el.dataset.type).sort()), ['error', 'info', 'success', 'warning'])
    assert.equal(await page.$eval('.hug-toast-details', el => el.textContent), '詳細1\n詳細2')
    assert.equal(await page.$eval('[data-description]', el => getComputedStyle(el).whiteSpace), 'pre-line')
    const button = await page.$('[data-close-button]')
    await page.waitForFunction(() => {
      const b = document.querySelector('[data-close-button]'), r = b.getBoundingClientRect()
      return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === b
        || b.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))
    })
    await button.click()
    await page.evaluate(() => api.clearAllToasts())
    await page.waitForFunction(() => !document.querySelector('[data-sonner-toast]'))
    await page.mouse.move(0, 0)
    await page.evaluate(() => api.showToast({ message: '自動終了', duration: 150, onClose: () => window.closeCount++ }))
    await page.waitForFunction(() => window.closeCount === 1)
    await page.waitForFunction(() => !document.querySelector('[data-sonner-toast]'))
    await page.evaluate(() => api.showToast({ message: '手動終了', duration: Infinity, onClose: () => window.closeCount++ }))
    await page.waitForSelector('[data-close-button]')
    await page.waitForFunction(() => {
      const button = document.querySelector('[data-close-button]')
      return button && button.getBoundingClientRect().y >= 0
    })
    await page.click('[data-close-button]')
    await page.waitForFunction(() => window.closeCount === 2)
    await page.waitForFunction(() => !document.querySelector('[data-sonner-toast]'))
    const defaults = await page.evaluate(() => {
      api.showSuccessToast('保存'); api.showErrorToast('エラー'); api.showWarningToast('確認'); api.showInfoToast('情報'); api.showResultToast({message:'結果'})
      return api.useToast() === api.useToast()
    })
    assert.equal(defaults, true)
    await page.waitForFunction(() => document.querySelectorAll('[data-sonner-toast]').length === 5)
    await page.emulateMediaType('print')
    assert.equal(await page.$eval('[data-sonner-toaster]', el => getComputedStyle(el).display), 'none')
    await page.emulateMediaType('screen')
    await page.evaluate(() => api.clearAllToasts())
    await page.waitForFunction(() => !document.querySelector('[data-sonner-toast]'))
    await page.mouse.move(0, 0)
    const start = Date.now()
    await page.evaluate(() => api.showToast({ message: 'デフォルト時間' }))
    await page.waitForSelector('[data-sonner-toast]')
    await page.waitForFunction(() => !document.querySelector('[data-sonner-toast]'))
    assert.ok(Date.now() - start >= 3000)
    assert.deepEqual(errors, [])
    console.log('PASS: types, text/details, modal stacking and close click, auto/manual callbacks, burst/clear, default duration, print, stable compatibility API; no page errors')
  } finally {
    if (browser) await browser.close()
    await fs.rm(dir, { recursive: true, force: true })
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
