import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { useDispatch } from 'react-redux'

import { checkLaravelConnection } from '@/hooks/useDataBase/checkLaravelConnection'

const CHECK_INTERVAL_MS = 5 * 60 * 1000;//5分ごとにLaravalとの接続を確認する

const ActiveApiStatus = ({ className = '' }) => {
  const dispatch = useDispatch()

  const [checking, setChecking] = useState(true)
  const [connected, setConnected] = useState(null)
  const [message, setMessage] = useState('Laravel APIへ接続確認中...')
  const [checkedAt, setCheckedAt] = useState(null)

  const checkConnection = useCallback(async () => {
    setChecking(true)

    try {
      const result = await checkLaravelConnection(dispatch, {
        autoFallbackToSqlite: false,
        switchToLaravelOnSuccess: false,
        persistIni: false,
      })

      const isConnected = result?.connected === true
      const now = new Date()

      setConnected(isConnected)
      setCheckedAt(now)
      setMessage(
        result?.message ||
          (isConnected
            ? 'Laravel APIと正常に通信できています'
            : 'Laravel APIと通信できません')
      )
    } catch (error) {
      console.error('[ActiveApiStatus] Laravel API接続確認エラー:', error)

      setConnected(false)
      setCheckedAt(new Date())
      setMessage(error?.message || 'Laravel APIとの通信確認に失敗しました')
    } finally {
      setChecking(false)
    }
  }, [dispatch])

  useEffect(() => {
    let disposed = false

    const runCheck = async () => {
      if (disposed) return
      await checkConnection()
    }

    runCheck()

    const intervalId = window.setInterval(runCheck, CHECK_INTERVAL_MS)

    return () => {
      disposed = true
      window.clearInterval(intervalId)
    }
  }, [checkConnection])

  const statusLabel = checking
    ? '確認中'
    : connected === true
      ? '接続OK'
      : '接続NG'

  const icon = checking ? (
    <Loader2 size={10} className="animate-spin" />
  ) : connected === true ? (
    <CheckCircle2 size={10} />
  ) : (
    <AlertCircle size={10} />
  )

  const statusClass = checking
    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
    : connected === true
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
      : 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100'

  const titleText = [
    `Laravel API: ${statusLabel}`,
    message,
    checkedAt ? `最終確認: ${checkedAt.toLocaleString('ja-JP')}` : null,
    'クリックすると再確認します',
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <button
      type="button"
      onClick={checkConnection}
      disabled={checking}
      className={[
        'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs leading-none transition',
        'disabled:cursor-wait',
        statusClass,
        className,
      ].join(' ')}
      title={titleText}
      aria-label={titleText}
    >
      <span className="shrink-0">{icon}</span>

      <span className="font-semibold">Laravel API</span>

      <span className="opacity-75">{statusLabel}</span>

      <RefreshCw
        size={10}
        className={['ml-1 opacity-70', checking ? 'animate-spin' : ''].join(' ')}
      />
    </button>
  )
}

export default ActiveApiStatus
