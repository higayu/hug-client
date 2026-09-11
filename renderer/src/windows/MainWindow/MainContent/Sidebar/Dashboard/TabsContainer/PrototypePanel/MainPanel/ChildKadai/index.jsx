import { useCallback, useEffect, useState } from 'react'

import { useAppState } from '@/AppStateContext'

import ChildKadaiTable from './ChildKadaiTable'
import CreateKadai from './ChildKadaiTable/TableRow/CreateKadai'
import EditKadai from './ChildKadaiTable/TableRow/EditKadai'
import ScoreChartPage from './ChildKadaiTable/TableRow/graph/ScoreChartPage'
import getChildKadaiGraph from './function/GetChildKadaiGraph'
import deleteChildKadai from './ChildKadaiTable/TableRow/function/DeleteChildKadai'

function ChildKadai() {
  const { SELECT_CHILD } = useAppState()

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [graphTarget, setGraphTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [creating, setCreating] = useState(false)
  const [recordTypeId, setRecordTypeId] = useState('')

  const loadRecords = useCallback(async (selectedRecordTypeId = recordTypeId) => {
    if (!SELECT_CHILD) {
      setRecords([])
      setLoading(false)
      setError('')
      return
    }

    if (!selectedRecordTypeId) {
      setRecords([])
      setError('課題のタイプを選択してください。')
      return
    }

    setLoading(true)
    setError('')

    try {
      setRecords(await getChildKadaiGraph({
        childrenId: SELECT_CHILD,
        recordTypeId: selectedRecordTypeId,
      }))
    } catch (loadError) {
      console.error('[ChildKadai] records load failed:', loadError)
      setRecords([])
      setError(loadError?.message || '課題記録の取得に失敗しました。')
    } finally {
      setLoading(false)
    }
  }, [SELECT_CHILD, recordTypeId])

  useEffect(() => {
    setRecords([])
    setRecordTypeId('')
    setError('')
  }, [SELECT_CHILD])

  const showTable = useCallback(() => {
    setGraphTarget(null)
    setEditTarget(null)
    setCreating(false)
  }, [])

  const handleSaved = useCallback(async () => {
    showTable()
    await loadRecords()
  }, [loadRecords, showTable])

  const handleDelete = useCallback(async (record) => {
    if (!window.confirm('この課題記録を削除しますか？')) return

    setError('')
    try {
      await deleteChildKadai(record.id)
      setRecords((current) => current.filter((item) => Number(item.id) !== Number(record.id)))
    } catch (deleteError) {
      setError(deleteError?.message || '課題記録の削除に失敗しました。')
    }
  }, [])

  if (!SELECT_CHILD) {
    return (
      <section className="p-4">
        <div className="rounded border border-yellow-300 bg-yellow-50 px-4 py-6 text-center font-medium text-yellow-800">
          児童を選択してください
        </div>
      </section>
    )
  }

  if (editTarget) {
    return <EditKadai record={editTarget} onCancel={showTable} onSaved={handleSaved} />
  }

  if (creating) {
    return (
      <CreateKadai
        initialChildrenId={SELECT_CHILD}
        initialRecordTypeId={recordTypeId}
        onCancel={showTable}
        onSaved={handleSaved}
      />
    )
  }

  if (graphTarget) {
    return <ScoreChartPage {...graphTarget} onBack={showTable} />
  }

  return (
    <ChildKadaiTable
      childRecords={records}
      recordsLoading={loading}
      recordsError={error}
      recordTypeId={recordTypeId}
      onRecordTypeChange={(value) => {
        setRecordTypeId(value)
        setRecords([])
        setError('')
      }}
      onLoad={() => loadRecords()}
      onCreate={() => setCreating(true)}
      onEdit={setEditTarget}
      onDelete={handleDelete}
      onShowGraph={setGraphTarget}
    />
  )
}

export { ChildKadaiTable }
export default ChildKadai
