// renderer/src/components/common/hug_function/PersonalRecord/OpenPersonalRecord/parts/injectPersonalRecordActions.js

import { getSharedHelpersScript } from './sharedHelpersScript.js'
import { getClipboardScript } from './clipboardScript.js'
import { getDraftScript } from './draftScript.js'

export async function injectPersonalRecordActions(webview) {
  const script = `
    (function () {
      try {
        const existingPasteBtn =
          document.getElementById("myPasteBtn")

        if (existingPasteBtn) {
          existingPasteBtn.remove()
        }

        const existingDraftBtn =
          document.getElementById("myCustomDraftBtn")

        if (existingDraftBtn) {
          existingDraftBtn.remove()
        }

        ${getSharedHelpersScript()}

        ${getClipboardScript()}

        ${getDraftScript()}

        const pasteBtn = createPasteButton()
        const draftBtn = createDraftButton()

        document.body.appendChild(pasteBtn)
        document.body.appendChild(draftBtn)

        console.log("✅ 個人記録用ボタン生成完了")
      } catch (error) {
        console.error(
          "❌ ボタン生成エラー:",
          error
        )
      }
    })();
  `

  await webview.executeJavaScript(script)
}
