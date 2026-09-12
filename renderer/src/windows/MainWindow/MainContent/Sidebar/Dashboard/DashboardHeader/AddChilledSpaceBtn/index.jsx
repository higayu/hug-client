import { Plus } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import {
  addChilledSpace,
  selectCanAddChilledSpace,
  selectSpaceCount,
} from "@/store/slices/chilledspaceSlice"

export default function AddChilledSpaceBtn() {
  const dispatch = useDispatch()
  const spaceCount = useSelector(selectSpaceCount)
  const canAdd = useSelector(selectCanAddChilledSpace)

  function onClick() {
    if (!canAdd) {
      return
    }

    dispatch(addChilledSpace())
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canAdd}
      className="
        flex h-10 w-10
        items-center justify-center
        rounded-full
        bg-blue-500
        text-white
        shadow
        transition
        hover:bg-blue-600
        active:scale-95
        disabled:cursor-not-allowed
        disabled:bg-gray-400
        disabled:opacity-50
        disabled:active:scale-100
      "
      aria-label={
        canAdd
          ? "作業枠を追加"
          : "作業枠は最大2枠です"
      }
      title={`作業枠 ${spaceCount}/2${canAdd ? " - 追加" : " - 上限"}`}
    >
      <Plus size={22} strokeWidth={2.5} />
    </button>
  )
}
