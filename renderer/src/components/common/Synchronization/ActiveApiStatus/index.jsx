import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react'

import { useDispatch } from 'react-redux'

import { checkLaravelConnection } from '@/hooks/useDataBase/checkLaravelConnection'
import { fetchLaravelAuthState } from '@/store/slices/authSlice'
import { useAppState } from '@/AppStateContext'

// 5分ごとにLaravelとの接続確認・認証情報の更新を行う
const CHECK_INTERVAL_MS = 5 * 60 * 1000

const ActiveApiStatus = ({ className = '' }) => {
  const dispatch = useDispatch()
  const { appState } = useAppState()

  const username = appState?.HUG_USERNAME ?? ''
  const password = appState?.HUG_PASSWORD ?? ''
  const hasCredentials = Boolean(username.trim() && password)

  const requestIdRef = useRef(0)
  const isRunningRef = useRef(false)
  const pendingCheckRef = useRef(null)

  const [checking, setChecking] = useState(true)
  const [connected, setConnected] = useState(null)
  const [message, setMessage] = useState(
    'Laravel APIへ接続確認中...'
  )
  const [checkedAt, setCheckedAt] = useState(null)

  // Laravel接続確認・認証情報更新
  const checkConnection = useCallback(async () => {
    // ログイン情報が設定されていない場合
    if (!hasCredentials) {
      requestIdRef.current += 1

      setConnected(false)
      setChecking(false)
      setCheckedAt(null)
      setMessage('HUGのログイン情報が設定されていません')

      return
    }

    // 通信の重複を防止
    if (isRunningRef.current) {
      pendingCheckRef.current = checkConnection
      return
    }

    const requestId = ++requestIdRef.current

    isRunningRef.current = true
    setChecking(true)

    try {
      // Laravelへの接続確認
      const result = await checkLaravelConnection(dispatch, {
        autoFallbackToSqlite: false,
        switchToLaravelOnSuccess: false,
        persistIni: false,
      })

      if (requestId !== requestIdRef.current) {
        return
      }

      const isConnected = result?.connected === true
      const now = new Date()

      setConnected(isConnected)
      setCheckedAt(now)

      setMessage(
        result?.message ||
          (
            isConnected
              ? 'Laravel APIと正常に通信できています'
              : 'Laravel APIと通信できません'
          )
      )

      // 接続成功時のみLaravelの認証情報を更新
      if (isConnected) {
        try {
          await dispatch(fetchLaravelAuthState()).unwrap()

          if (requestId !== requestIdRef.current) {
            return
          }

          console.log(
            '[ActiveApiStatus] Laravel認証情報の更新完了'
          )
        } catch (authError) {
          if (requestId !== requestIdRef.current) {
            return
          }

          console.error(
            '[ActiveApiStatus] Laravel認証情報の更新に失敗:',
            authError
          )

          setMessage(
            'Laravel APIに接続できましたが、認証情報の更新に失敗しました'
          )
        }
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return
      }

      console.error(
        '[ActiveApiStatus] Laravel API接続確認エラー:',
        error
      )

      setConnected(false)
      setCheckedAt(new Date())

      setMessage(
        error?.message ||
          'Laravel APIとの通信確認に失敗しました'
      )
    } finally {
      isRunningRef.current = false

      if (requestId === requestIdRef.current) {
        setChecking(false)
      }

      const pendingCheck = pendingCheckRef.current
      pendingCheckRef.current = null
      if (pendingCheck) {
        void pendingCheck()
      }
    }
  }, [dispatch, hasCredentials, username, password])

  // 初回実行・定期実行
  useEffect(() => {
    let disposed = false

    // 前回の通信が終了してから確認する
    const runCheck = async () => {
      if (disposed) {
        return
      }

      await checkConnection()
    }

    // 初回実行
    runCheck()

    // 5分ごとに実行
    const intervalId = window.setInterval(
      runCheck,
      CHECK_INTERVAL_MS
    )

    // クリーンアップ
    return () => {
      disposed = true
      pendingCheckRef.current = null

      requestIdRef.current += 1

      window.clearInterval(intervalId)
    }
  }, [checkConnection])

  // 表示状態
  const isChecking = hasCredentials && checking
  const isConnected = hasCredentials && connected === true

  const statusLabel = isChecking
    ? '確認中'
    : isConnected
      ? '接続OK'
      : '接続NG'

  // ステータスアイコン
  const icon = isChecking ? (
    <Loader2 size={10} className="animate-spin" />
  ) : isConnected ? (
    <CheckCircle2 size={10} />
  ) : (
    <AlertCircle size={10} />
  )

  // ステータス別のスタイル
  const statusClass = isChecking
    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
    : isConnected
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
      : 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100'

  // ツールチップ
  const titleText = [
    `Laravel API: ${statusLabel}`,

    hasCredentials
      ? message
      : 'HUGのログイン情報が設定されていません',

    hasCredentials && checkedAt
      ? `最終確認: ${checkedAt.toLocaleString('ja-JP')}`
      : null,

    'クリックすると接続確認・認証情報の更新を行います',
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <button
      type="button"
      onClick={checkConnection}
      disabled={isChecking}
      className={[
        'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs leading-none transition',
        'disabled:cursor-wait',
        statusClass,
        className,
      ].join(' ')}
      title={titleText}
      aria-label={titleText}
    >
      <span className="shrink-0">
        {icon}
      </span>

      <span className="opacity-75">
        {statusLabel}
      </span>

      <RefreshCw
        size={10}
        className={[
          'ml-1 opacity-70',
          isChecking ? 'animate-spin' : '',
        ].join(' ')}
      />
    </button>
  )
}

export default ActiveApiStatus