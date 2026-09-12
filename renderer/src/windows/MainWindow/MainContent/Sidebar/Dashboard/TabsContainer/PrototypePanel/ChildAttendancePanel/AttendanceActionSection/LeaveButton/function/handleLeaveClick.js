export function handleLeaveClick({ onLeave }) {
  if (typeof onLeave !== "function") {
    console.warn("[LeaveButton] onLeaveが設定されていません")
    return undefined
  }

  return onLeave()
}
