// renderer/src/components/common/hug_function/PersonalRecord/OpenPersonalRecord/parts/runInitialSearch.js

export async function runInitialSearch(webview, currentYmd) {
  const dateValue = JSON.stringify(String(currentYmd ?? ''))

  await webview.executeJavaScript(`
    (function () {
      try {
        const dp1 = document.querySelector('input[name="date"]')
        const dp2 = document.querySelector('input[name="date_end"]')

        if (dp1 && dp2) {
          dp1.value = ${dateValue}
          dp2.value = ${dateValue}

          dp1.dispatchEvent(new Event("input", { bubbles: true }))
          dp1.dispatchEvent(new Event("change", { bubbles: true }))
          dp2.dispatchEvent(new Event("input", { bubbles: true }))
          dp2.dispatchEvent(new Event("change", { bubbles: true }))
        }

        const btn = document.querySelector('button.btn.btn-sm.search')

        if (btn) {
          setTimeout(() => {
            btn.click()
          }, 500)
        }
      } catch (error) {
        console.error("❌ 初期検索エラー", error)
      }
    })();
  `)
}
