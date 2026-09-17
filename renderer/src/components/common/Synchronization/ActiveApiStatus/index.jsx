import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Database,
  Server,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'

import { selectDatabaseType } from '@/store/slices/appStateSlice'
import {
  checkMariaDbConnection,
  switchDatabaseType,
} from '@/hooks/useDataBase/checkMariaDbConnection'
import { checkLaravelConnection } from '@/hooks/useDataBase/checkLaravelConnection'

const ActiveApiStatus = ({ className = '' }) => {
  const dispatch = useDispatch()

  // ★ useAppState ではなく Redux Slice を直接読む
  const reduxDatabaseType = useSelector(selectDatabaseType)

  const [switching, setSwitching] = useState(false)
  const [lastMessage, setLastMessage] = useState('')

  const databaseType = String(reduxDatabaseType || 'sqlite')
    .trim()
    .toLowerCase()

  const isMariaDb = databaseType === 'mariadb'
  const isLaravel = databaseType === 'laravel'
  const isSqlite = databaseType === 'sqlite'

  const icon = switching ? (
    <Loader2 size={10} className="animate-spin" />
  ) : isMariaDb ? (
    <Server size={10} />
  ) : isLaravel ? (
    <Server size={10} />
  ) : isSqlite ? (
    <Database size={10} />
  ) : (
    <AlertCircle size={10} />
  )

  const label = isMariaDb
    ? 'MariaDB'
    : isLaravel
      ? 'Laravel API'
    : isSqlite
      ? 'SQLite'
      : 'DB未確定'

  const detail = isMariaDb
    ? '接続モード'
    : isLaravel
      ? ''
    : isSqlite
      ? '非常用モード'
      : '未初期化'

  const nextLabel = isMariaDb
    ? 'Laravel APIへ切替'
    : isLaravel
      ? 'SQLiteへ切替'
      : 'MariaDBへ切替'

  const handleToggleDatabaseType = async () => {
    if (switching) return

    console.group('[ActiveApiStatus] handleToggleDatabaseType')
    console.log('クリック時 databaseType:', databaseType)
    console.log('クリック時 isMariaDb:', isMariaDb)
    console.log('クリック時 isLaravel:', isLaravel)
    console.log('クリック時 isSqlite:', isSqlite)

    setSwitching(true)
    setLastMessage('')

    try {
      if (isLaravel) {
        const result = await switchDatabaseType({
          dispatch,
          databaseType: 'sqlite',
          message: '手動で SQLite に切り替えました',
          persistIni: true,
        })

        console.log('[ActiveApiStatus] switchDatabaseType result:', result)
        setLastMessage(result?.message || 'SQLite に切り替えました')
        return
      }

      if (isMariaDb) {
        const connectionResult = await checkLaravelConnection(dispatch, {
          autoFallbackToSqlite: false,
          switchToLaravelOnSuccess: false,
          persistIni: false,
        })

        console.log(
          '[ActiveApiStatus] checkLaravelConnection result:',
          connectionResult
        )

        const connected = connectionResult?.connected === true

        const result = await switchDatabaseType({
          dispatch,
          databaseType: 'laravel',
          message: connected
            ? 'Laravel API に切り替えました'
            : 'Laravel API に切り替えました（接続確認は失敗しました）',
          persistIni: true,
        })

        console.log(
          '[ActiveApiStatus] Laravel switchDatabaseType result:',
          result
        )

        setLastMessage(
          result?.message ||
            'Laravel API に切り替えました'
        )
        return
      }

      const result = await checkMariaDbConnection(dispatch, {
        autoFallbackToSqlite: true,
        switchToMariaDbOnSuccess: true,
        persistIni: true,
      })

      console.log('[ActiveApiStatus] checkMariaDbConnection result:', result)

      setLastMessage(
        result?.message ||
          (result?.connected
            ? 'MariaDB に切り替えました'
            : 'MariaDB に接続できませんでした')
      )
    } catch (error) {
      console.error('[ActiveApiStatus] DB切替エラー:', error)
      setLastMessage(error?.message || 'DB切替に失敗しました')
    } finally {
      setSwitching(false)
      console.groupEnd()
    }
  }

  const titleText = [
    isMariaDb
      ? 'サーバー側APIを使用しています'
      : isLaravel
        ? 'Laravel APIを使用しています'
      : isSqlite
        ? 'ローカルSQLiteを使用しています'
        : 'DATABASE_TYPE がまだ確定していません',
    `現在: ${label}`,
    `Redux DATABASE_TYPE: ${databaseType}`,
    '現在は Laravel API のみ使用します',
    lastMessage ? `結果: ${lastMessage}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <button
      type="button"
      disabled
      className={[
        'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs leading-none transition',
        'disabled:cursor-not-allowed disabled:opacity-70',
        isMariaDb
          ? 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100'
          : isLaravel
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          : isSqlite
            ? 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
            : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100',
        className,
      ].join(' ')}
      title={titleText}
      aria-label={titleText}
    >
      <span className="shrink-0">
        {icon}
      </span>

      <span className="font-semibold">
        {label}
      </span>

      <span className="opacity-75">
        {switching ? '切替中...' : detail}
      </span>

      <RefreshCw size={10} className="ml-1 opacity-70" />
    </button>
  )
}

export default ActiveApiStatus
