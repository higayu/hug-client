import { useEffect, useState } from 'react'

export function usePreloadPath() {
  const [preloadPath, setPreloadPath] = useState(null)

  useEffect(() => {
    const fetchPreloadPath = async () => {
      try {
        const path = await window.electronAPI?.getPreloadPath?.()
        if (path) {
          setPreloadPath(path)
          void 0
        } else {
          console.warn('⚠️ [usePreloadPath] preloadパスが取得できませんでした')
        }
      } catch (error) {
        console.error('❌ [usePreloadPath] preloadパスの取得に失敗しました:', error)
      }
    }

    fetchPreloadPath()
  }, [])

  return preloadPath
}

