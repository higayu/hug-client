// renderer/src/components/common/hug_function/PersonalRecord/OpenPersonalRecord/parts/setupRecordStaff.js

export async function setupRecordStaff(webview, staffId) {
  const staffValue = JSON.stringify(String(staffId ?? ''))

  await webview.executeJavaScript(`
    (function () {
      const select = document.querySelector('select[name="record_staff"]')

      if (!select) {
        console.warn("⚠️ record_staff が見つかりません")
        return
      }

      select.value = ${staffValue}
      select.dispatchEvent(new Event("change", { bubbles: true }))

      console.log("✅ record_staff 自動設定:", select.value)
    })();
  `)
}
