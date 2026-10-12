// renderer/src/components/common/hug_function/PersonalRecord/OpenPersonalRecord/parts/clipboardScript.js

export function getClipboardScript() {
  return String.raw`
    async function getClipboardText(targetTextarea) {
      // 方法1: Clipboard API
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText()

          if (text && text.length > 0) {
            console.log("✅ クリップボードAPIで読み取り成功")

            return {
              text,
              mode: "automatic"
            }
          }
        }
      } catch (apiError) {
        console.warn(
          "⚠️ クリップボードAPI失敗:",
          apiError.message
        )
      }

      // 方法2: execCommand
      try {
        const tempTextarea = document.createElement("textarea")

        tempTextarea.style.position = "fixed"
        tempTextarea.style.opacity = "0"
        tempTextarea.style.left = "-9999px"
        tempTextarea.style.top = "-9999px"

        document.body.appendChild(tempTextarea)

        const activeElement = document.activeElement

        tempTextarea.focus()

        const success = document.execCommand("paste")

        if (success) {
          const text = tempTextarea.value

          document.body.removeChild(tempTextarea)

          if (activeElement) {
            activeElement.focus()
          }

          if (text && text.length > 0) {
            console.log("✅ execCommandで読み取り成功")

            return {
              text,
              mode: "automatic"
            }
          }
        }

        if (document.body.contains(tempTextarea)) {
          document.body.removeChild(tempTextarea)
        }

        if (activeElement) {
          activeElement.focus()
        }

        console.warn("⚠️ execCommandでの貼り付けに失敗")
      } catch (execError) {
        console.warn(
          "⚠️ execCommandエラー:",
          execError.message
        )
      }

      // 方法3: 手動入力
      console.warn(
        "⚠️ 自動読み取りができないため、手動入力を促します"
      )

      return new Promise((resolve) => {
        const existingValue =
          targetTextarea
            ? targetTextarea.value || ""
            : ""

        const overlay = document.createElement("div")

        overlay.style.position = "fixed"
        overlay.style.top = "0"
        overlay.style.left = "0"
        overlay.style.width = "100%"
        overlay.style.height = "100%"
        overlay.style.backgroundColor = "rgba(0,0,0,0.5)"
        overlay.style.zIndex = "9999999"
        overlay.style.display = "flex"
        overlay.style.justifyContent = "center"
        overlay.style.alignItems = "center"

        const dialog = document.createElement("div")

        dialog.style.backgroundColor = "white"
        dialog.style.padding = "30px"
        dialog.style.borderRadius = "10px"
        dialog.style.maxWidth = "600px"
        dialog.style.width = "90%"
        dialog.style.boxShadow = "0 10px 40px rgba(0,0,0,0.3)"

        const title = document.createElement("h3")
        title.textContent = "📋 クリップボードの内容を貼り付けてください"
        title.style.marginTop = "0"
        title.style.color = "#333"

        const description = document.createElement("p")
        description.textContent =
          "自動読み取りに失敗しました。手動で貼り付けてください。"
        description.style.color = "#666"
        description.style.fontSize = "14px"

        const status = document.createElement("p")
        status.textContent =
          existingValue
            ? "✅ 現在の値が初期設定されています（編集可能です）"
            : "💡 現在の値は空です"
        status.style.color =
          existingValue
            ? "#4CAF50"
            : "#999"
        status.style.fontSize = "13px"
        status.style.margin = "5px 0 10px 0"

        const textarea = document.createElement("textarea")

        textarea.id = "manualPasteTextarea"
        textarea.value = existingValue
        textarea.placeholder =
          "ここにテキストを貼り付けてください (Ctrl+V / ⌘V)"
        textarea.style.width = "100%"
        textarea.style.height = "200px"
        textarea.style.padding = "10px"
        textarea.style.border =
          existingValue
            ? "2px solid #4CAF50"
            : "2px solid #ccc"
        textarea.style.borderRadius = "5px"
        textarea.style.fontSize = "14px"
        textarea.style.fontFamily = "inherit"
        textarea.style.boxSizing = "border-box"
        textarea.style.resize = "vertical"

        const buttons = document.createElement("div")

        buttons.style.marginTop = "15px"
        buttons.style.display = "flex"
        buttons.style.gap = "10px"
        buttons.style.justifyContent = "flex-end"

        const cancelBtn = document.createElement("button")
        cancelBtn.textContent = "キャンセル"
        cancelBtn.style.padding = "10px 20px"
        cancelBtn.style.border = "1px solid #ccc"
        cancelBtn.style.borderRadius = "5px"
        cancelBtn.style.background = "white"
        cancelBtn.style.cursor = "pointer"
        cancelBtn.style.fontSize = "14px"

        const clearBtn = document.createElement("button")
        clearBtn.textContent = "🗑️ クリア"
        clearBtn.style.padding = "10px 20px"
        clearBtn.style.border = "1px solid #f44336"
        clearBtn.style.borderRadius = "5px"
        clearBtn.style.background = "white"
        clearBtn.style.color = "#f44336"
        clearBtn.style.cursor = "pointer"
        clearBtn.style.fontSize = "14px"

        const confirmBtn = document.createElement("button")
        confirmBtn.textContent = "✅ 挿入"
        confirmBtn.style.padding = "10px 20px"
        confirmBtn.style.border = "none"
        confirmBtn.style.borderRadius = "5px"
        confirmBtn.style.background = "#4CAF50"
        confirmBtn.style.color = "white"
        confirmBtn.style.cursor = "pointer"
        confirmBtn.style.fontSize = "14px"
        confirmBtn.style.fontWeight = "bold"

        buttons.appendChild(cancelBtn)
        buttons.appendChild(clearBtn)
        buttons.appendChild(confirmBtn)

        dialog.appendChild(title)
        dialog.appendChild(description)
        dialog.appendChild(status)
        dialog.appendChild(textarea)
        dialog.appendChild(buttons)

        overlay.appendChild(dialog)
        document.body.appendChild(overlay)

        setTimeout(() => {
          textarea.focus()

          if (existingValue) {
            textarea.selectionStart = textarea.value.length
            textarea.selectionEnd = textarea.value.length
          }
        }, 100)

        clearBtn.addEventListener("click", () => {
          textarea.value = ""
          textarea.focus()
        })

        confirmBtn.addEventListener("click", () => {
          const text = textarea.value

          document.body.removeChild(overlay)

          resolve(
            text && text.trim().length > 0
              ? {
                  text,
                  mode: "manual"
                }
              : null
          )
        })

        cancelBtn.addEventListener("click", () => {
          document.body.removeChild(overlay)
          resolve(null)
        })

        textarea.addEventListener("keydown", (event) => {
          if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey)
          ) {
            event.preventDefault()
            confirmBtn.click()
            return
          }

          if (event.key === "Escape") {
            event.preventDefault()
            cancelBtn.click()
          }
        })
      })
    }

    function createPasteButton() {
      const pasteBtn = document.createElement("button")

      pasteBtn.id = "myPasteBtn"
      pasteBtn.innerText = "📋 入力"

      pasteBtn.style.position = "fixed"
      pasteBtn.style.top = "50%"
      pasteBtn.style.right = "180px"
      pasteBtn.style.transform = "translateY(-50%)"
      pasteBtn.style.zIndex = "999999"
      pasteBtn.style.padding = "10px 18px"
      pasteBtn.style.color = "white"
      pasteBtn.style.fontSize = "14px"
      pasteBtn.style.fontWeight = "bold"
      pasteBtn.style.border = "none"
      pasteBtn.style.borderRadius = "8px"
      pasteBtn.style.cursor = "pointer"
      pasteBtn.style.boxShadow = "0 3px 12px rgba(0,0,0,0.3)"
      pasteBtn.style.transition = "all 0.3s ease"
      pasteBtn.style.letterSpacing = "0.5px"
      pasteBtn.style.backgroundColor = "#4CAF50"
      pasteBtn.style.whiteSpace = "nowrap"

      pasteBtn.addEventListener("mouseenter", () => {
        pasteBtn.style.transform =
          "translateY(-50%) scale(1.05)"

        pasteBtn.style.boxShadow =
          "0 6px 20px rgba(0,0,0,0.4)"
      })

      pasteBtn.addEventListener("mouseleave", () => {
        pasteBtn.style.transform =
          "translateY(-50%) scale(1)"

        pasteBtn.style.boxShadow =
          "0 3px 12px rgba(0,0,0,0.3)"
      })

      pasteBtn.addEventListener(
        "click",
        async function () {
          console.log(
            "📋 貼り付けボタンがクリックされました"
          )

          this.style.backgroundColor = "#FF9800"
          this.innerText = "⏳ 貼り付け中..."
          this.style.transform =
            "translateY(-50%) scale(0.95)"

          try {
            const targetTextarea =
              document.querySelector(
                'textarea[name="note"][data-field-key="note"]'
              ) ||
              document.querySelector(
                'textarea[name="note"]'
              )

            if (!targetTextarea) {
              console.error(
                "❌ テキストエリアが見つかりません"
              )

              this.style.backgroundColor = "#f44336"
              this.innerText = "❌ エラー"

              resetButton(this, {
                backgroundColor: "#4CAF50",
                text: "📋 入力"
              })

              return
            }

            const clipboardResult =
              await getClipboardText(targetTextarea)

            if (
              !clipboardResult ||
              !clipboardResult.text ||
              clipboardResult.text.trim().length === 0
            ) {
              console.error(
                "❌ 貼り付け内容が空です"
              )

              this.style.backgroundColor = "#f44336"
              this.innerText = "❌ 空です"

              resetButton(this, {
                backgroundColor: "#4CAF50",
                text: "📋 入力"
              })

              return
            }

            scrollToElement(targetTextarea)

            const existingValue =
              targetTextarea.value || ""

            let newValue = ""

            if (clipboardResult.mode === "manual") {
              // 手動入力画面には既存値を初期値として表示しているため、
              // 確定した内容をそのまま使用する。
              newValue = clipboardResult.text
            } else if (existingValue.trim().length > 0) {
              // 自動取得成功時は既存値の下に空白行を1行挟んで追記。
              newValue =
                existingValue +
                "\n\n" +
                clipboardResult.text
            } else {
              newValue = clipboardResult.text
            }

            targetTextarea.value = newValue

            targetTextarea.dispatchEvent(
              new Event(
                "input",
                {
                  bubbles: true
                }
              )
            )

            targetTextarea.dispatchEvent(
              new Event(
                "change",
                {
                  bubbles: true
                }
              )
            )

            highlightElement(targetTextarea)
            targetTextarea.focus()

            try {
              targetTextarea.selectionStart =
                targetTextarea.value.length

              targetTextarea.selectionEnd =
                targetTextarea.value.length
            } catch (cursorError) {
              console.warn(
                "⚠️ カーソル移動失敗",
                cursorError
              )
            }

            console.log(
              "✅ テキストを追記しました"
            )

            this.style.backgroundColor = "#4CAF50"
            this.innerText = "✅ 完了！"

            resetButton(this, {
              backgroundColor: "#4CAF50",
              text: "📋 入力"
            })
          } catch (error) {
            console.error(
              "❌ 貼り付けエラー:",
              error
            )

            this.style.backgroundColor = "#f44336"
            this.innerText = "❌ エラー"

            resetButton(this, {
              backgroundColor: "#4CAF50",
              text: "📋 入力"
            })
          }
        }
      )

      return pasteBtn
    }
  `
}
