import { Plus } from "lucide-react"

export default function AddChilledSpaceBtn() {

    function onClick() {
            console.log("AddChilledSpace clicked");
    }

  return (
    <button
      type="button"
      onClick={onClick}
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
      "
      aria-label="追加"
    >
      <Plus size={22} strokeWidth={2.5} />
    </button>
  )
}