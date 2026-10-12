// renderer/src/hooks/useDataBase/index.js
// Laravel専用の実行経路。旧MariaDB/SQLite実装は sql/ に保存。
import { useEffect, useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useAppState } from '@/AppStateContext'
import { fetchAllTables } from '@/store/slices/databaseSlice'
import { fetchLaravelAuthState } from '@/store/slices/authSlice'
import { laravelApi } from './sql/laravelApi'

/**
 * 全テーブル取得は常にLaravel APIを使用する。
 * forceDatabaseTypeやuseAutoSwitchingなどの旧オプションは互換性のため受け付けるが、
 * DB切替には使用しない。
 */
export function useDataBase({ autoLoad = false } = {}) {
  const { isInitialized, resetChilledspace } = useAppState()
  const dispatch = useDispatch()
  const loadingRef = useRef(false)
  const didAutoLoadRef = useRef(false)
  const loadSeqRef = useRef(0)

  const loadDataBase = useCallback(async (options = {}) => {
    const loadId = ++loadSeqRef.current
    const reason = options.reason || 'manual/unknown'
    const force = options.force === true

    if (!isInitialized) {
      console.warn('[useDataBase] 初期化前のため取得をスキップ:', reason)
      return false
    }
    if (loadingRef.current && !force) {
      console.warn('[useDataBase] 取得中のためスキップ:', reason)
      return false
    }

    loadingRef.current = true
    try {
      // 他DBへのフォールバック・接続確認・自動切替は一切行わない。
      const tables = await laravelApi.getAllTables()
      if (!tables || typeof tables !== 'object') {
        console.error('[useDataBase] Laravelの全テーブル取得に失敗:', reason)
        return false
      }
      await dispatch(fetchAllTables(tables))
      await dispatch(fetchLaravelAuthState())
      console.log('[useDataBase] Laravel取得完了:', {
        loadId,
        reason,
        tableKeys: Object.keys(tables),
      })
      return true
    } catch (error) {
      console.error('[useDataBase] Laravel取得エラー:', error)
      return false
    } finally {
      loadingRef.current = false
    }
  }, [dispatch, isInitialized])

  const reloadData = useCallback(async (options = {}) => {
    return loadDataBase({ ...options, force: true, reason: options.reason || 'manual-reload' })
  }, [loadDataBase])

  useEffect(() => {
    if (!autoLoad) return undefined
    const handleDatabaseTypeChanged = async () => {
      // 設定画面などが旧DB種別を通知してもLaravelからのみ再取得する。
      resetChilledspace()
      await loadDataBase({ reason: 'event/database-type-changed' })
    }
    window.addEventListener('database-type-changed', handleDatabaseTypeChanged)
    return () => window.removeEventListener('database-type-changed', handleDatabaseTypeChanged)
  }, [autoLoad, loadDataBase, resetChilledspace])

  useEffect(() => {
    if (!autoLoad || didAutoLoadRef.current || !isInitialized) return
    didAutoLoadRef.current = true
    void loadDataBase({ reason: 'autoLoad/after-initialized-once' })
  }, [autoLoad, isInitialized, loadDataBase])

  return { loadDataBase, reloadData }
}
