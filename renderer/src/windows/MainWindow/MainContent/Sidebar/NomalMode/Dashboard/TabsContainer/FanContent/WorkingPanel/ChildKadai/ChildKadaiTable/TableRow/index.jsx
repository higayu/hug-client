import { TrashIcon } from '@heroicons/react/24/outline'

function TableRow({ action, record, onDelete, onEdit }) {
  if (action === 'edit') {
    return (
      <button
        type="button"
        onClick={() => onEdit?.(record)}
        className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
      >
        編集
      </button>
    )
  }

  if (action === 'delete') {
    return (
      <button
        type="button"
        onClick={() => onDelete?.(record)}
        className="rounded p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
        title="削除"
        aria-label="削除"
      >
        <TrashIcon className="h-5 w-5" aria-hidden="true" />
      </button>
    )
  }

  return null
}

export default TableRow
