// renderer/src/components/common/hug_function/PersonalRecord/OpenPersonalRecord/parts/openPersonalRecordEdit.js

export async function openPersonalRecordEdit(webview) {
  return webview.executeJavaScript(`
    (function () {
      try {
        const table = document.querySelector("table.table.lh1_5")

        if (!table) {
          return null
        }

        const rows = table.querySelectorAll("tbody tr")

        if (!rows.length) {
          return null
        }

        let newFlg = false

        for (const row of rows) {
          const cells = row.querySelectorAll("td")

          if (cells.length < 8) {
            continue
          }

          const span = cells[5].querySelector("span.label")
          const status = span ? span.innerText.trim() : ""

          if (status.includes("未作成")) {
            newFlg = true
          }

          const editBtn =
            cells[7].querySelector("button.btn.btn-sm.m0.edit")

          if (editBtn) {
            editBtn.click()

            return {
              newFlg
            }
          }
        }

        return null
      } catch (error) {
        console.error("❌ 編集探索エラー", error)
        return null
      }
    })();
  `)
}
