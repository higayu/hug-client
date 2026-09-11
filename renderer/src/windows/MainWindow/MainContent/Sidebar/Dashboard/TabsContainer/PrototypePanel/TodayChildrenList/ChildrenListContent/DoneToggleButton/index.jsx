// renderer/src/components/Sidebar/Tools/SelectChildren/TodayChildrenList/ChildrenListContent/DoneToggleButton/index.jsx

export default function DoneToggleButton({
  checked = false,
  onChange,
}) {
  const handleClick = (event) => {
    event.stopPropagation()
    onChange?.(!checked)
  }

  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={handleClick}
      className={`w-8 h-8 rounded-full border text-xs font-bold flex items-center justify-center transition ${
        checked
          ? "bg-green-500 border-green-600 text-white"
          : "bg-white border-gray-400 text-gray-500 hover:bg-gray-100"
      }`}
    >
      済
    </button>
  )
}