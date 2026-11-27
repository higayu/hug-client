// AppStateContext/useWindowBridge/index.js
import { useEffect } from 'react'

/**
 * Redux / AppStateContext の状態と操作関数を window に公開する互換ブリッジ
 *
 * 方針:
 * - activeApi は使用しない
 * - window.AppState には Redux の appState だけを入れる
 * - actions は window.updateAppState などとして直接公開する
 */
export function useWindowBridge({
  isInitialized,
  appState,
  actions = {},
}) {
  useEffect(() => {
    if (!isInitialized) return

    window.AppState = { ...appState }

    Object.assign(window, actions)

    return () => {
      delete window.AppState

      Object.keys(actions).forEach((key) => {
        delete window[key]
      })

      void 0
    }
  }, [isInitialized, appState, actions])
}