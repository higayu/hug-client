// renderer/src/components/Sidebar/Tools/SelectChildren/TodayChildrenList/ChildrenListContent/ChildListItem.jsx
import DoneToggleButton from "./DoneToggleButton"

const DEFAULT_CLASSES = {
  base: "p-2 my-1 border rounded cursor-pointer flex justify-between items-center",
  default: "bg-gray-50 hover:bg-gray-200",
  selected: "bg-cyan-200 border-l-4 border-cyan-700 font-bold",
}

const EXITED_CLASSES = {
  default: "bg-yellow-50 hover:bg-yellow-200",
  selected: "bg-yellow-200 border-l-4 border-yellow-600 font-bold",
}

export default function ChildListItem({
  child,
  isSelected = false,
  onSelect,
  getTitle,
  showPcName = true,
  isDone = false,
  onToggleDone,
  isAbsent = false,
  isExited = false,
}) {
  const notesTitle = getTitle?.(child)

  // 欠席は色自体は変えず、最後に grayscale / opacity を付ける
  // 退室済み かつ 欠席ではない場合のみ黄色系にする
  const shouldUseExitedColor = isExited && !isAbsent

  const stateClasses = shouldUseExitedColor
    ? isSelected
      ? EXITED_CLASSES.selected
      : EXITED_CLASSES.default
    : isSelected
      ? DEFAULT_CLASSES.selected
      : DEFAULT_CLASSES.default

  const absentClasses = isAbsent ? " grayscale opacity-30" : ""

  const itemClassName = `${DEFAULT_CLASSES.base} ${stateClasses}${absentClasses}`

  const handleClick = () => {
    onSelect?.(
      child.children_id,
      child.children_name,
      child.pc_name
    )
  }

  return (
    <li
      title={notesTitle}
      className={itemClassName}
      onClick={handleClick}
    >
      <span>
        {child.children_id}: {child.children_name}
        {showPcName ? ` : ${child.pc_name || ""}` : ""}
      </span>

      <DoneToggleButton
        checked={isDone}
        onChange={(checked) => onToggleDone?.(child, checked)}
      />
    </li>
  )
}