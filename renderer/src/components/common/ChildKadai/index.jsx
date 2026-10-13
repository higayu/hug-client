import { useCallback, useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { useAppState } from '@/AppStateContext'
import { setRecordTypes } from '@/store/slices/databaseSlice'
import { laravelApi } from '@/hooks/useDataBase/sql/laravelApi'
import { selectSpaceChildId } from '@/store/slices/chilledspaceSlice.js'

import ChildKadaiTable from './ChildKadaiTable'
import CreateKadai from './ChildKadaiTable/TableRow/CreateKadai'
import EditKadai from './ChildKadaiTable/TableRow/EditKadai'
import ScoreChartPage from './ChildKadaiTable/TableRow/graph/ScoreChartPage'
import getChildKadaiGraph from './function/GetChildKadaiGraph'
import deleteChildKadai from './ChildKadaiTable/TableRow/function/DeleteChildKadai'

function ChildKadai({ spaceId }) {
  const selectedChildId = useSelector(selectSpaceChildId(spaceId))
  const { FACILITY_ID } = useAppState()
  const dispatch = useDispatch()
  const [recordTypesLoading, setRecordTypesLoading] = useState(false)
  const [recordTypesError, setRecordTypesError] = useState('')

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [graphTarget, setGraphTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [creating, setCreating] = useState(false)
  const [recordTypeId, setRecordTypeId] = useState('')

  const loadRecords = useCallback(async (selectedRecordTypeId = recordTypeId) => {
    if (!selectedChildId) {
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
        childrenId: selectedChildId,
        recordTypeId: selectedRecordTypeId,
      }))
    } catch (loadError) {
      console.error('[ChildKadai] records load failed:', loadError)
      setRecords([])
      setError(loadError?.message || '課題記録の取得に失敗しました。')
    } finally {
      setLoading(false)
    }
  }, [selectedChildId, recordTypeId])

  useEffect(() => {
    setRecords([])
    setRecordTypeId('')
    setError('')
  }, [selectedChildId])

  // ChildKadaiを開いたとき、および施設ID変更時に課題タイプを個別取得する。
  useEffect(() => {
    let active = true
    const facilityId = Number(FACILITY_ID)

    // 別施設の課題タイプ・選択状態を引き継がない。
    dispatch(setRecordTypes([]))
    setRecordTypeId('')
    setRecords([])
    setGraphTarget(null)
    setEditTarget(null)
    setCreating(false)
    setRecordTypesError('')

    if (!Number.isInteger(facilityId) || facilityId <= 0) {
      setRecordTypesLoading(false)
      setRecordTypesError('施設IDが設定されていません。')
      return () => { active = false }
    }

    setRecordTypesLoading(true)
    const fetchTypes = async () => {
      try {
        const types = await laravelApi.getRecordTypes(facilityId)
        if (!active) return
        dispatch(setRecordTypes(types.filter((type) => Number(type.facility_id) === facilityId)))
      } catch (fetchError) {
        if (!active) return
        console.error('[ChildKadai] record types load failed:', fetchError)
        dispatch(setRecordTypes([]))
        setRecordTypesError(fetchError?.message || '課題タイプの取得に失敗しました。')
      } finally {
        if (active) setRecordTypesLoading(false)
      }
    }
    void fetchTypes()
    return () => { active = false }
  }, [FACILITY_ID, dispatch])

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

  if (!selectedChildId) {
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
        initialChildrenId={selectedChildId}
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
      spaceId={spaceId}
      childRecords={records}
      recordsLoading={loading}
      recordTypesLoading={recordTypesLoading}
      recordTypesError={recordTypesError}
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
