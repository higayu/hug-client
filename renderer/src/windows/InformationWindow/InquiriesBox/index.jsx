import { useEffect, useRef, useState } from 'react'
import { CameraIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline'

const MAX_FILES = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_TOTAL_SIZE = 50 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

const formatBytes = (bytes) => {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KiB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
}

function validateFiles(current, candidates) {
  const accepted = []
  const errors = []
  let total = current.reduce((sum, item) => sum + item.file.size, 0)

  for (const file of candidates) {
    if (current.length + accepted.length >= MAX_FILES) {
      errors.push('スクリーンショットは5枚まで添付できます。')
      break
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      errors.push(`${file.name}: PNG、JPEG、WebPのみ添付できます。`)
      continue
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: 1枚あたり10MiB以内にしてください。`)
      continue
    }
    if (total + file.size > MAX_TOTAL_SIZE) {
      errors.push(`${file.name}: 添付画像の合計は50MiB以内にしてください。`)
      continue
    }
    total += file.size
    accepted.push({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) })
  }
  return { accepted, errors }
}

const errorByStatus = (status) => ({
  401: 'ログイン情報が無効です。再ログインしてください。',
  403: '問い合わせを送信する権限がありません。',
  413: '添付画像の容量が大きすぎます。',
  422: '入力内容または添付画像を確認してください。',
  429: '送信回数が上限に達しました。時間をおいて再度お試しください。',
  500: 'サーバーでエラーが発生しました。',
  502: 'サーバーとの通信に失敗しました。',
  503: 'サーバーとの通信に失敗しました。',
  504: 'サーバーとの通信に失敗しました。',
}[status])

function inquiryErrorMessage(result) {
  const validationErrors = result?.error?.validationErrors
  if (validationErrors && typeof validationErrors === 'object') {
    const messages = Object.values(validationErrors).flat().filter(Boolean)
    if (messages.length) return messages.join('\n')
  }
  const status = result?.status || result?.meta?.status || result?.error?.status
  return errorByStatus(status) || result?.message || '問い合わせの送信に失敗しました。'
}

export default function InquiriesBox() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState([])
  const [appVersion, setAppVersion] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [success, setSuccess] = useState(null)
  const filesRef = useRef(files)
  const inputRef = useRef(null)

  useEffect(() => { filesRef.current = files }, [files])
  useEffect(() => () => filesRef.current.forEach((item) => URL.revokeObjectURL(item.url)), [])
  useEffect(() => {
    window.electronAPI?.inquiryGetAppVersion?.().then((version) => setAppVersion(String(version || '')))
  }, [])

  const addFiles = (incoming) => {
    const result = validateFiles(files, Array.from(incoming || []))
    setFiles((current) => [...current, ...result.accepted])
    setError(result.errors.join('\n'))
  }

  useEffect(() => {
    if (!open) return undefined
    const onPaste = (event) => {
      const images = Array.from(event.clipboardData?.items || [])
        .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
        .map((item) => item.getAsFile()).filter(Boolean)
      if (images.length) addFiles(images)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [open, files])

  useEffect(() => {
    if (!open || (!message.trim() && !files.length && !sending)) return undefined
    const onBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [open, message, files.length, sending])

  const removeFile = (id) => setFiles((current) => current.filter((item) => {
    if (item.id === id) URL.revokeObjectURL(item.url)
    return item.id !== id
  }))

  const close = () => {
    if (sending) {
      if (!window.confirm('送信中です。画面を閉じますか？')) return
    } else if ((message.trim() || files.length) && !success) {
      if (!window.confirm('入力中の内容を破棄しますか？')) return
    }
    files.forEach((item) => URL.revokeObjectURL(item.url))
    setFiles([])
    setMessage('')
    setError('')
    setSuccess(null)
    setOpen(false)
  }

  const capture = async () => {
    setError('')
    try {
      const result = await window.electronAPI?.inquiryCaptureScreen?.()
      if (!result?.success) throw new Error(result?.message || 'アプリ画面の撮影に失敗しました。')
      const file = new File([result.bytes], result.name, { type: result.type })
      addFiles([file])
    } catch (captureError) {
      setError(captureError?.message || 'アプリ画面の撮影に失敗しました。')
    }
  }

  const submit = async () => {
    setError('')
    const trimmed = message.trim()
    if (!trimmed) return setError('報告内容を入力してください。')
    if (trimmed.length > 10000) return setError('報告内容は10,000文字以内で入力してください。')
    const checked = validateFiles([], files.map((item) => item.file))
    checked.accepted.forEach((item) => URL.revokeObjectURL(item.url))
    if (checked.errors.length || checked.accepted.length !== files.length) return setError(checked.errors.join('\n') || '添付画像を確認してください。')
    if (!window.confirm(`報告内容と添付画像 ${files.length}枚を送信しますか？`)) return

    setSending(true)
    try {
      const screenshots = await Promise.all(files.map(async ({ file }) => ({
        name: file.name,
        type: file.type,
        bytes: new Uint8Array(await file.arrayBuffer()),
      })))
      const result = await window.electronAPI?.inquirySubmit?.({ message: trimmed, appVersion, screenshots })
      if (!result?.success) {
        const status = result?.status || result?.meta?.status || result?.error?.status
        throw Object.assign(new Error(inquiryErrorMessage(result)), { status })
      }
      const data = result.data?.data ?? result.data ?? result
      files.forEach((item) => URL.revokeObjectURL(item.url))
      setFiles([])
      setMessage('')
      setSuccess({ id: data?.id ?? result?.id ?? null })
    } catch (submitError) {
      setError(errorByStatus(submitError?.status) || submitError?.message || '問い合わせの送信に失敗しました。')
    } finally {
      setSending(false)
    }
  }

  const totalSize = files.reduce((sum, item) => sum + item.file.size, 0)

  return (
    <section className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-bold text-slate-800">解決しない場合</h2><p className="text-sm text-slate-600">不具合や改善要望をサポートへ送信できます。</p></div>
        <button type="button" onClick={() => { setOpen(true); setSuccess(null); setError('') }} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">問い合わせ・不具合報告</button>
      </div>

      {open && <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="問い合わせ・不具合報告">
        <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">問い合わせ・不具合報告</h2><button type="button" onClick={close} aria-label="閉じる"><XMarkIcon className="h-7 w-7" /></button></div>
          {success ? <div className="rounded-lg bg-emerald-50 p-8 text-center text-emerald-800"><p className="text-lg font-bold">問い合わせを送信しました。</p>{success.id && <p className="mt-2">受付番号：#{success.id}</p>}<button type="button" onClick={() => setOpen(false)} className="mt-6 rounded-lg bg-slate-700 px-5 py-2 text-white">閉じる</button></div> : <>
            <label className="block text-sm font-bold">報告内容 <span className="text-red-600">必須</span></label>
            <textarea value={message} maxLength={10000} onChange={(event) => setMessage(event.target.value)} rows={7} placeholder="発生した不具合や改善してほしい内容を入力してください。どの画面で、どのような操作をしたときに発生したかを記載すると、原因の調査がしやすくなります。" className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" />
            <p className="text-right text-xs text-slate-500">{message.length.toLocaleString()} / 10,000文字</p>

            <div onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }} className={`mt-4 rounded-lg border-2 border-dashed p-4 ${dragging ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}>
              <div className="flex flex-wrap gap-2"><button type="button" onClick={() => inputRef.current?.click()} className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm text-white"><PaperClipIcon className="h-5 w-5" />画像を追加</button><button type="button" onClick={capture} className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm text-white"><CameraIcon className="h-5 w-5" />アプリ画面を撮影</button></div>
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
              <p className="mt-3 text-xs text-slate-500">ドラッグ＆ドロップまたは Ctrl + V でも追加できます（最大5枚、1枚10MiB、合計50MiB）。</p>
            </div>

            {files.length > 0 && <div className="mt-4"><p className="mb-2 text-sm font-semibold">添付 {files.length}/5枚・合計 {formatBytes(totalSize)}</p><div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">{files.map((item) => <div key={item.id} className="relative rounded-lg border p-2"><a href={item.url} target="_blank" rel="noreferrer"><img src={item.url} alt={item.file.name} className="h-28 w-full rounded object-cover" /></a><p className="mt-1 truncate text-xs" title={item.file.name}>{item.file.name}</p><p className="text-xs text-slate-500">{formatBytes(item.file.size)}</p><button type="button" onClick={() => removeFile(item.id)} className="absolute right-1 top-1 rounded-full bg-slate-900/80 p-1 text-white" aria-label={`${item.file.name}を削除`}><XMarkIcon className="h-4 w-4" /></button></div>)}</div></div>}
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">スクリーンショットに個人情報や機密情報が含まれていないか、送信前に確認してください。</p>
            <p className="mt-3 text-sm text-slate-500">アプリバージョン：{appVersion || '取得中...'}</p>
            {error && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
            <div className="mt-5 flex justify-end gap-3"><button type="button" disabled={sending} onClick={close} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">キャンセル</button><button type="button" disabled={sending || !message.trim()} onClick={submit} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{sending ? '送信中...' : '送信する'}</button></div>
          </>}
        </div>
      </div>}
    </section>
  )
}
