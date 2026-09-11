// renderer/src/components/Sidebar/Tools/SelectChildren/TodayChildrenList/ChildrenListContent/index.jsx
import { MESSAGES } from "@/utils/app/constants.js"
import ChildListItem from "./ChildListItem"
import { TABS } from "@/components/common/constants";

export default function ChildrenListContent({
  activeTab,
  normalChildren = [],
  sometimesChildren = [],
  temporaryChildren = [],
  waitingChildrenData = [],
  experienceChildrenData = [],
  selectedChildId,
  onSelectChild,
  getChildNotesTitle,
  doneChildIds = [],
  onToggleDone,
  getChildAbsent,
  getChildExited,
}) {
  const noChildrenMessage =
    MESSAGES?.INFO?.NO_CHILDREN ?? "表示できる児童はいません"

  const noWaitingMessage =
    MESSAGES?.INFO?.NO_WAITING ?? "キャンセルの児童はいません"

  const noExperienceMessage =
    MESSAGES?.INFO?.NO_EXPERIENCE ?? "体験の児童はいません"

  const isChildDone = (child) => {
    return doneChildIds.includes(child.children_id)
  }

  const renderEmpty = (message) => (
    <li className="px-3 py-2 text-sm text-gray-500">
      {message}
    </li>
  )

  const renderChildItem = (child, showPcName = true) => {
    if (!child) {
      return null
    }

    return (
      <ChildListItem
        key={child.children_id}
        child={child}
        isSelected={String(selectedChildId) === String(child.children_id)}
        onSelect={onSelectChild}
        getTitle={getChildNotesTitle}
        showPcName={showPcName}
        isDone={isChildDone(child)}
        onToggleDone={onToggleDone}
        isAbsent={getChildAbsent?.(child) ?? false}
        isExited={getChildExited?.(child) ?? false}
      />
    )
  }

  switch (activeTab) {
    case TABS.NORMAL:
      return normalChildren.length
        ? normalChildren.map((child) => renderChildItem(child))
        : renderEmpty(noChildrenMessage)

    case TABS.SOMETIMES:
      return sometimesChildren.length
        ? sometimesChildren.map((child) => renderChildItem(child))
        : renderEmpty("時折対応の児童はいません")

    case TABS.TEMPORARY:
      return temporaryChildren.length
        ? temporaryChildren.map((child) => renderChildItem(child))
        : renderEmpty("一時対応の児童はいません")

    case TABS.WAITING:
      return waitingChildrenData.length
        ? waitingChildrenData.map((child) => renderChildItem(child, false))
        : renderEmpty(noWaitingMessage)

    case TABS.EXPERIENCE:
      return experienceChildrenData.length
        ? experienceChildrenData.map((child) => renderChildItem(child, false))
        : renderEmpty(noExperienceMessage)

    default:
      return renderEmpty("表示できるタブがありません")
  }
}