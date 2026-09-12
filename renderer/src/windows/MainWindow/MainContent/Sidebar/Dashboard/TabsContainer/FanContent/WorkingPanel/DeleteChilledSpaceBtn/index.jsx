import { X } from "lucide-react"

export default function DeleteChilledSpaceBtn() {
  function onClick() {
    console.log("DeleteChilledSpace clicked")
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex h-10 w-10
        items-center justify-center
        rounded-full
        bg-red-500
        text-white
        shadow
        transition
        hover:bg-red-600
        active:scale-95
      "
      aria-label="削除"
    >
      <X size={22} strokeWidth={2.5} />
    </button>
  )
}