// renderer/src/components/common/hug_function/PersonalRecord/OpenPersonalRecord/parts/draftScript.js

export function getDraftScript() {
  return String.raw`
    function findDraftSaveButton() {
      let saveButton =
        document.querySelector(
          'button[data-save-button][value="1"]'
        )

      if (!saveButton) {
        saveButton =
          document.querySelector(
            'button.btn.btn-sm.draft[data-save-button=""]'
          )
      }

      if (!saveButton) {
        const allButtons =
          document.querySelectorAll("button")

        for (const button of allButtons) {
          if (
            button.textContent.includes("下書き") ||
            button.textContent.includes("draft") ||
            (
              button.hasAttribute("data-save-button") &&
              button.getAttribute("value") === "1"
            )
          ) {
            saveButton = button
            break
          }
        }
      }

      return saveButton
    }

    function createDraftButton() {
      const draftBtn = document.createElement("button")

      draftBtn.id = "myCustomDraftBtn"
      draftBtn.innerText = "💾 下書き保存"

      draftBtn.style.position = "fixed"
      draftBtn.style.top = "50%"
      draftBtn.style.right = "20px"
      draftBtn.style.transform = "translateY(-50%)"
      draftBtn.style.zIndex = "999999"
      draftBtn.style.padding = "10px 18px"
      draftBtn.style.color = "white"
      draftBtn.style.fontSize = "14px"
      draftBtn.style.fontWeight = "bold"
      draftBtn.style.border = "none"
      draftBtn.style.borderRadius = "8px"
      draftBtn.style.cursor = "pointer"
      draftBtn.style.boxShadow = "0 3px 12px rgba(0,0,0,0.3)"
      draftBtn.style.transition = "all 0.3s ease"
      draftBtn.style.letterSpacing = "0.5px"
      draftBtn.style.backgroundColor = "#9C27B0"
      draftBtn.style.whiteSpace = "nowrap"

      draftBtn.addEventListener("mouseenter", () => {
        draftBtn.style.transform =
          "translateY(-50%) scale(1.05)"

        draftBtn.style.boxShadow =
          "0 6px 20px rgba(0,0,0,0.4)"
      })

      draftBtn.addEventListener("mouseleave", () => {
        draftBtn.style.transform =
          "translateY(-50%) scale(1)"

        draftBtn.style.boxShadow =
          "0 3px 12px rgba(0,0,0,0.3)"
      })

      draftBtn.addEventListener(
        "click",
        function () {
          console.log(
            "💾 下書き保存ボタンがクリックされました"
          )

          this.style.backgroundColor = "#FF9800"
          this.innerText = "⏳ 保存中..."
          this.style.transform =
            "translateY(-50%) scale(0.95)"

          try {
            const saveButton =
              findDraftSaveButton()

            if (!saveButton) {
              console.error(
                "❌ 下書き保存ボタンが見つかりません"
              )

              this.style.backgroundColor = "#f44336"
              this.innerText = "❌ エラー"

              resetButton(this, {
                backgroundColor: "#9C27B0",
                text: "💾 下書き保存"
              })

              return
            }

            console.log(
              "✅ 下書き保存ボタンを発見:",
              saveButton
            )

            scrollToElement(saveButton)
            highlightElement(saveButton)

            setTimeout(() => {
              try {
                saveButton.click()

                console.log(
                  "✅ 標準クリック実行"
                )
              } catch (error) {
                console.warn(
                  "⚠️ 標準クリック失敗:",
                  error
                )

                try {
                  const clickEvent =
                    new MouseEvent(
                      "click",
                      {
                        view: window,
                        bubbles: true,
                        cancelable: true
                      }
                    )

                  saveButton.dispatchEvent(
                    clickEvent
                  )

                  console.log(
                    "✅ dispatchEventクリック実行"
                  )
                } catch (fallbackError) {
                  console.error(
                    "❌ すべてのクリック方法が失敗:",
                    fallbackError
                  )
                }
              }

              this.style.backgroundColor = "#4CAF50"
              this.innerText = "✅ 保存完了！"

              resetButton(this, {
                backgroundColor: "#9C27B0",
                text: "💾 下書き保存",
                delay: 2500
              })
            }, 500)
          } catch (error) {
            console.error(
              "❌ 下書き保存エラー:",
              error
            )

            this.style.backgroundColor = "#f44336"
            this.innerText = "❌ エラー"

            resetButton(this, {
              backgroundColor: "#9C27B0",
              text: "💾 下書き保存"
            })
          }
        }
      )

      return draftBtn
    }
  `
}
