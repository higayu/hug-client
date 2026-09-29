import { useSelector } from 'react-redux'

import { selectLaravelAuth } from '@/store/slices/authSlice'

function formatValue(value) {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value || '(empty)'
  return JSON.stringify(value, null, 2)
}

export default function DebugTab() {
  const auth = useSelector(selectLaravelAuth)

  if (Number(auth.user?.role_id ?? 0) < 100) {
    return null
  }

  const fields = [
    ['authenticated', auth.authenticated],
    ['hasAccessToken', auth.hasAccessToken],
    ['status', auth.status],
    ['error', auth.error],
  ]

  return (
    <div>
      <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg text-gray-700">
        認証状態
      </h3>

      <dl className="divide-y divide-gray-200 border-y border-gray-200">
        {fields.map(([name, value]) => (
          <div key={name} className="grid grid-cols-[180px_minmax(0,1fr)] gap-4 py-3">
            <dt className="font-mono text-sm font-semibold text-gray-600">{name}</dt>
            <dd className="break-words font-mono text-sm text-gray-900">
              {formatValue(value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold text-gray-700">user</h4>
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words border border-gray-300 bg-gray-50 p-3 text-xs text-gray-900">
          {formatValue(auth.user)}
        </pre>
      </div>
    </div>
  )
}
