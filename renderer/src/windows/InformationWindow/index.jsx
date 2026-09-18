import { useCallback, useEffect, useMemo, useState } from 'react'

const CATEGORY_LABELS = {
  database: 'データベース',
  laravel: 'Laravel',
  electron: 'Electron',
  network: 'ネットワーク',
  api: 'API',
  windows: 'Windows',
  other: 'その他',
}

function normalizeKnowledgeList(result) {
  const payload = result?.data ?? result

  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items

  return []
}

function splitLines(value) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function DetailSection({ title, value, pre = false }) {
  if (!value) return null

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      {pre ? (
        <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-slate-950 p-3 text-xs leading-6 text-slate-100">
          {value}
        </pre>
      ) : (
        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
          {value}
        </p>
      )}
    </section>
  )
}

function KnowledgeCard({ item, number }) {
  const [open, setOpen] = useState(false)
  const solutionLines = splitLines(item.solution)
  const question = item.question || item.title || '質問内容なし'
  const categoryLabel = CATEGORY_LABELS[item.category] || item.category || null

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start gap-4 px-5 py-5 text-left hover:bg-slate-50"
        aria-expanded={open}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">
          Q{number}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold leading-7 text-slate-800">
              {question}
            </h2>

            {categoryLabel && (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                {categoryLabel}
              </span>
            )}

            {item.system_key && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {item.system_key}
              </span>
            )}
          </div>

          {item.title && item.title !== question && (
            <p className="mt-1 text-sm text-slate-500">{item.title}</p>
          )}
        </div>

        <span className="mt-1 shrink-0 text-xl text-slate-400">
          {open ? '−' : '+'}
        </span>
      </button>

      <div className="border-t border-slate-100 bg-slate-50 px-5 py-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-700">
          <span>✓</span>
          <span>対応方法</span>
        </div>

        {solutionLines.length > 0 ? (
          <ul className="space-y-2">
            {solutionLines.map((line, index) => (
              <li
                key={`${item.id ?? number}-solution-${index}`}
                className="flex gap-2 text-sm leading-7 text-slate-700"
              >
                <span className="mt-0.5 shrink-0 font-bold text-emerald-600">✓</span>
                <span className="break-words">{line}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">対応方法が登録されていません。</p>
        )}

        {open && (
          <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5">
            <DetailSection title="症状・現象" value={item.symptom} />
            <DetailSection
              title="エラーメッセージ・ログ"
              value={item.error_message}
              pre
            />
            <DetailSection title="原因" value={item.cause} />
            <DetailSection title="確認方法・切り分け" value={item.check_method} />
            <DetailSection title="再発防止" value={item.prevention} />

            {item.keywords && (
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-700">
                  検索キーワード
                </h3>
                <div className="flex flex-wrap gap-2">
                  {String(item.keywords)
                    .split(',')
                    .map((keyword) => keyword.trim())
                    .filter(Boolean)
                    .map((keyword) => (
                      <span
                        key={`${item.id ?? number}-${keyword}`}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                      >
                        {keyword}
                      </span>
                    ))}
                </div>
              </section>
            )}

            {item.reference_url && (
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-700">参考URL</h3>
                <a
                  href={item.reference_url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-blue-600 underline hover:text-blue-800"
                >
                  {item.reference_url}
                </a>
              </section>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export default function InformationWindow() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [systemKey, setSystemKey] = useState('')

  const loadKnowledge = useCallback(async () => {
    const api = window.electronAPI?.laravel_troubleshootingKnowledge_getAll

    if (typeof api !== 'function') {
      setError('Q&A取得APIが利用できません。main / preload の更新を確認してください。')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await api()

      if (result?.success === false) {
        throw new Error(result?.message || result?.error || 'Q&Aの取得に失敗しました。')
      }

      setItems(normalizeKnowledgeList(result))
    } catch (loadError) {
      console.error('[InformationWindow] Q&A取得エラー:', loadError)
      setError(loadError?.message || 'Q&Aの取得に失敗しました。')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadKnowledge()
  }, [loadKnowledge])

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))].sort(),
    [items]
  )

  const systemKeys = useMemo(
    () => [...new Set(items.map((item) => item.system_key).filter(Boolean))].sort(),
    [items]
  )

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return items.filter((item) => {
      if (category && item.category !== category) return false
      if (systemKey && item.system_key !== systemKey) return false
      if (!normalizedQuery) return true

      const searchableText = [
        item.title,
        item.question,
        item.symptom,
        item.error_message,
        item.cause,
        item.check_method,
        item.solution,
        item.prevention,
        item.keywords,
        item.system_key,
        CATEGORY_LABELS[item.category],
      ]
        .filter(Boolean)
        .join('\n')
        .toLowerCase()

      return searchableText.includes(normalizedQuery)
    })
  }, [items, query, category, systemKey])

  return (
    <div className="min-h-screen bg-slate-100 pb-12 text-slate-800">
      <header className="border-b-4 border-red-600 bg-slate-800 px-5 py-7 text-white shadow-lg">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-black">Q&amp;A・障害対応</h1>
          <p className="mt-1 text-sm text-slate-300">
            よくある質問、エラー、確認方法、対応手順を確認できます。
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6">
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_220px_auto]">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="質問・対応内容を検索..."
              className="min-w-0 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
            >
              <option value="">全カテゴリ</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABELS[value] || value}
                </option>
              ))}
            </select>

            <select
              value={systemKey}
              onChange={(event) => setSystemKey(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
            >
              <option value="">全システム</option>
              {systemKeys.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadKnowledge}
              disabled={loading}
              className="rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              再読み込み
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            表示 {visibleItems.length} 件 / 全 {items.length} 件
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            Q&amp;Aを読み込んでいます...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
            <div className="font-bold">Q&amp;Aを取得できませんでした。</div>
            <div className="mt-1 break-words">{error}</div>
          </div>
        )}

        {!loading && !error && visibleItems.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            該当するQ&amp;Aが見つかりませんでした。
          </div>
        )}

        {!loading && !error && visibleItems.length > 0 && (
          <div className="space-y-4">
            {visibleItems.map((item, index) => (
              <KnowledgeCard
                key={item.id ?? `${item.title}-${index}`}
                item={item}
                number={index + 1}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
