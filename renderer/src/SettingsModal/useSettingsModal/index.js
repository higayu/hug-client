import { useEffect, useState } from 'react'
import { useAppState } from '@/AppStateContext';

import { loadConfig } from '@/utils/config/configUtils'

export function useSettingsModal(isOpen) {
  const [isLoading, setIsLoading] = useState(false)
  const { loadIni } = useAppState()

  // モーダルが開かれた時に設定を再読み込み
  useEffect(() => {
    if (!isOpen) return

    const loadSettings = async () => {
      setIsLoading(true)
      try {
        console.log('🔄 [useSettingsModal] 設定を再読み込み中...')
        await loadIni()
        await loadConfig()
        console.log('✅ [useSettingsModal] 設定の再読み込み完了')
      } catch (error) {
        console.error('❌ [useSettingsModal] 設定の再読み込みエラー:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [isOpen, loadIni])

  return { isLoading }
}

