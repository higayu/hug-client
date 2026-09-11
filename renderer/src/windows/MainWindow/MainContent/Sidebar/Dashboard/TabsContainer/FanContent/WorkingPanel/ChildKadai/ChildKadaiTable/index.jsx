import { useMemo } from 'react'
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'

import { useAppState } from '@/AppStateContext'

import ChildKadaiFilter from './common/ChildKadaiFilter'
import TableRow from './TableRow'

ModuleRegistry.registerModules([AllCommunityModule])

const asArray = (value) => Array.isArray(value) ? value : []

const formatDate = (value) => {
  if (!value) return ''

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value).slice(0, 10)
    : date.toLocaleDateString('ja-JP')
}

function ChildKadaiTable({
  childRecords,
  recordsLoading,
  recordsError,
  recordTypeId,
  onRecordTypeChange,
  onLoad,
  onCreate,
  onEdit,
  onDelete,
  onShowGraph,
}) {
  const { FACILITY_ID, SELECT_CHILD, databaseState } = useAppState()

  const children = asArray(databaseState?.children)
  const recordTypes = asArray(databaseState?.record_types)

  const facilities = asArray(databaseState?.facilitys)
  const childTypes = asArray(databaseState?.children_type)

  const selectedChild = useMemo(
    () => children.find((child) => Number(child.id) === Number(SELECT_CHILD)),
    [SELECT_CHILD, children],
  )

  const rowData = useMemo(() => {
    const childById = new Map(children.map((row) => [Number(row.id), row]))
    const facilityById = new Map(facilities.map((row) => [Number(row.id), row]))
    const childTypeById = new Map(childTypes.map((row) => [Number(row.id), row]))

    return childRecords
      .filter((record) => !FACILITY_ID || Number(record.facility_id) === Number(FACILITY_ID))
      .map((record) => {
        const child = childById.get(Number(record.children_id))

        return {
          ...record,
          child_type_name: childTypeById.get(Number(child?.children_type_id))?.name ?? '',
          facility_name: facilityById.get(Number(record.facility_id))?.name ?? '',
        }
      })
      .filter((row) => Number(row.children_id) === Number(SELECT_CHILD))
      .filter((row) => Number(row.record_type_id) === Number(recordTypeId))
  }, [
    FACILITY_ID,
    childRecords,
    childTypes,
    children,
    facilities,
    SELECT_CHILD,
    recordTypeId,
    recordTypes,
  ])

  const columnDefs = useMemo(() => [
    {
      headerName: '編集',
      width: 90,
      sortable: false,
      resizable: false,
      cellRenderer: ({ data }) => (
        <TableRow action="edit" record={data} onEdit={onEdit} />
      ),
    },
    {
      headerName: '',
      width: 64,
      sortable: false,
      resizable: false,
      cellRenderer: ({ data }) => (
        <TableRow action="delete" record={data} onDelete={onDelete} />
      ),
    },
    {
      headerName: '日付',
      field: 'date',
      width: 120,
      minWidth: 110,
      maxWidth: 140,
      sort: 'desc',
      valueFormatter: ({ value }) => formatDate(value),
    },
    {
      headerName: '点数',
      field: 'score',
      type: 'numericColumn',
      width: 90,
      minWidth: 80,
      maxWidth: 110,
    },
    {
      headerName: 'ミス数',
      field: 'mistakes',
      type: 'numericColumn',
      width: 95,
      minWidth: 85,
      maxWidth: 115,
    },
    {
      headerName: '施設名',
      field: 'facility_name',
      width: 160,
      minWidth: 130,
      maxWidth: 220,
    },
    {
      headerName: '児童タイプ',
      field: 'child_type_name',
      width: 140,
      minWidth: 120,
      maxWidth: 180,
    },
    {
      headerName: 'メモ1',
      field: 'memo1',
      flex: 1,
      minWidth: 180,
    },
    {
      headerName: 'メモ2',
      field: 'memo2',
      flex: 1.4,
      minWidth: 220,
    },
  ], [onDelete, onEdit])

  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    minWidth: 70,
  }), [])

  return (
    <section className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">児童課題記録一覧</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{rowData.length}件</span>
          <button
            type="button"
            onClick={() => onShowGraph?.({
              childrenId: SELECT_CHILD,
              recordTypeId,
            })}
            disabled={!recordTypeId}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            グラフ表示
          </button>
          <button type="button" onClick={onCreate} className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">
            新規追加
          </button>
        </div>
      </div>

      <ChildKadaiFilter
        selectedChildId={SELECT_CHILD}
        selectedChildName={selectedChild?.name ?? ''}
        filterRecordTypeId={recordTypeId}
        setFilterRecordTypeId={onRecordTypeChange}
        recordTypes={recordTypes}
        loading={recordsLoading}
        onLoad={onLoad}
      />

      <div style={{ height: 500 }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination
          paginationPageSize={20}
          paginationPageSizeSelector={[20, 50, 100]}
          loading={recordsLoading}
          overlayNoRowsTemplate="表示できる課題記録がありません。"
          theme={themeQuartz}
        />
      </div>
      {recordsError && (
        <p className="mt-2 text-sm text-red-600">{recordsError}</p>
      )}
    </section>
  )
}

export default ChildKadaiTable
