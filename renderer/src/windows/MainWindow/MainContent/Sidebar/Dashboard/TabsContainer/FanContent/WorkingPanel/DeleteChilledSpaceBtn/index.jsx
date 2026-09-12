import { X } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import {
  deleteChilledSpace,
  selectCanDeleteChilledSpace,
  selectSpaceCount,
} from "@/store/slices/chilledspaceSlice"

export default function DeleteChilledSpaceBtn({ spaceId }) {
  const dispatch = useDispatch()
  const spaceCount = useSelector(selectSpaceCount)
  const canDelete = useSelector(selectCanDeleteChilledSpace)

  async function onClick() {
    if (!canDelete) {
      return
    }

    const confirmDialog =
      window.electronAPI?.confirmDialog

    if (typeof confirmDialog !== "function") {
      console.error(
        "[DeleteChilledSpaceBtn] confirmDialog API が利用できません"
      )
      return
    }

    const confirmed = await confirmDialog(
      "この作業枠を削除しますか？"
    )

    if (!confirmed) {
      return
    }

    dispatch(deleteChilledSpace(spaceId))
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canDelete}
      className="
        flex h-5 w-5
        items-center justify-center
        rounded-full
        bg-red-500
        text-white
        shadow
        transition
        hover:bg-red-600
        active:scale-95
        disabled:cursor-not-allowed
        disabled:bg-gray-400
        disabled:opacity-40
        disabled:active:scale-100
      "
      aria-label={
        canDelete
          ? `${spaceId} の作業枠を削除`
          : "作業枠が1つのため削除できません"
      }
      title={
        canDelete
          ? `この作業枠を削除（${spaceCount}/2）`
          : "最低1枠は必要です"
      }
    >
      <X size={14} strokeWidth={2.5} />
    </button>
  )
}
