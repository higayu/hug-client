import React, { useCallback } from "react"
import { FaRobot } from "react-icons/fa"

import { useTabs } from "@/hooks/useTabs"
import { useAppState } from "@/AppStateContext"
import {
  createWebview,
  createTabButton,
} from "@/hooks/useTabs/common/index.js"
import { confirmDialog } from "@/utils/dialog/confirmDialog.js"

import {
  runEnableTemporaryChatAfterLoad,
} from "./enableTemporaryChatInWebview.js"

const OPENAI_URL = "https://chatgpt.com/?temporary-chat=true"
const TAB_LABEL = "OpenAI ChatGPT"

export default function OpenAiTabButton() {
  const { appState } = useAppState()
  const { activateTab, closeTab } = useTabs()

  const handleOpenAI = useCallback(() => {
    const tabsContainer = document.getElementById("tabs")
    const webviewContainer =
      document.getElementById("webview-container")

    if (!tabsContainer || !webviewContainer) {
      console.error(
        "tabs または webview-container が見つかりません",
      )
      alert("タブ領域が見つかりません。")
      return
    }

    const newId =
      `openai-${Date.now()}-${document.querySelectorAll("webview").length}`

    const newWebview = createWebview(
      newId,
      OPENAI_URL,
    )

    webviewContainer.appendChild(newWebview)

    const tabButton = createTabButton(
      newId,
      TAB_LABEL,
      appState.closeButtonsVisible,
    )

    if (!tabButton) {
      newWebview.remove()
      return
    }

    tabsContainer.appendChild(tabButton)

    let tabClosed = false
    let temporaryChatDone = false
    let enablePending = false

    function notifyWebviewTabClosed() {
      window.dispatchEvent(
        new CustomEvent("app:webview-tab-closed", {
          detail: {
            tabId: newId,
          },
        }),
      )
    }

    function restoreRendererFocus() {
      const activeElement = document.activeElement

      if (activeElement instanceof HTMLElement) {
        activeElement.blur()
      }

      window.focus()

      if (document.body) {
        document.body.focus()
      }

      const textarea =
        document.querySelector(
          '[data-memo-input="true"]:not([disabled]):not([readonly])',
        ) ??
        document.querySelector(
          "textarea:not([disabled]):not([readonly])",
        )

      if (textarea instanceof HTMLTextAreaElement) {
        textarea.focus({
          preventScroll: true,
        })
      }
    }

    function restoreFocusAfterDomUpdate() {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          notifyWebviewTabClosed()
          restoreRendererFocus()
        })
      })
    }

    function handleTabClick() {
      if (tabClosed) {
        return
      }

      activateTab(newId)
    }

    async function handleCloseClick(event) {
      event.preventDefault()
      event.stopPropagation()

      const shouldClose = await confirmDialog(
        "このタブを閉じますか？",
      )

      if (!shouldClose) {
        restoreFocusAfterDomUpdate()
        return
      }

      tabClosed = true

      try {
        newWebview.blur()
      } catch (error) {
        console.warn(
          "webviewのblurに失敗しました",
          error,
        )
      }

      /*
       * 登録したイベントを解除
       */
      tabButton.removeEventListener(
        "click",
        handleTabClick,
      )

      closeBtn?.removeEventListener(
        "click",
        handleCloseClick,
      )

      newWebview.removeEventListener(
        "did-finish-load",
        scheduleEnableTemporaryChat,
      )

      newWebview.removeEventListener(
        "dom-ready",
        scheduleEnableTemporaryChat,
      )

      closeTab(newId)

      /*
       * closeTab側でwebviewが削除されなかった場合の保険
       */
      if (newWebview.isConnected) {
        newWebview.remove()
      }

      /*
       * closeTab側でタブボタンが削除されなかった場合の保険
       */
      if (tabButton.isConnected) {
        tabButton.remove()
      }

      restoreFocusAfterDomUpdate()
    }

    function scheduleEnableTemporaryChat() {
      if (
        tabClosed ||
        temporaryChatDone ||
        enablePending ||
        !newWebview.isConnected
      ) {
        return
      }

      enablePending = true

      runEnableTemporaryChatAfterLoad(newWebview)
        .then((ok) => {
          if (!tabClosed && ok) {
            temporaryChatDone = true
          }
        })
        .catch((error) => {
          if (!tabClosed) {
            console.error(
              "一時チャット有効化処理でエラー",
              error,
            )
          }
        })
        .finally(() => {
          enablePending = false
        })
    }

    tabButton.addEventListener(
      "click",
      handleTabClick,
    )

    const closeBtn =
      tabButton.querySelector(".close-btn")

    if (closeBtn) {
      closeBtn.addEventListener(
        "click",
        handleCloseClick,
      )
    }

    newWebview.addEventListener(
      "did-finish-load",
      scheduleEnableTemporaryChat,
    )

    newWebview.addEventListener(
      "dom-ready",
      scheduleEnableTemporaryChat,
    )

    activateTab(newId)
  }, [
    appState.closeButtonsVisible,
    activateTab,
    closeTab,
  ])

  return (
    <button
      type="button"
      onClick={handleOpenAI}
      className="
        min-w-[150px]
        flex items-center justify-center gap-2
        bg-indigo-600 hover:bg-indigo-700
        text-white rounded-xl shadow-md
        px-3 py-2 transition-colors
      "
      title="新しいタブで開く"
    >
      <FaRobot size={18} />
      <span>OpenAIを起動</span>
    </button>
  )
}