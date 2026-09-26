import {
  useEffect,
  useMemo,
} from "react"

import AbsenceButton from "./AbsenceButton"

import {
  EnterButton,
  LeaveButton,
  canPostEnter,
  canPostLeave,
  hasEnterMail,
  hasLeaveMail,
  buildEnterButtonTitle,
  buildLeaveButtonTitle,
  isAfternoonEnterBlocked,
} from "@/components/common/hug_function/AttendanceAction"

/**
 * 拡張入退室フォーム相当の入室・退室・欠席 UI
 */
export default function AttendanceActionSection({
  spaceId,
  facilityId,
  childId,
  childName,
  dateStr,
  column5,
  column5Html,
  column6,
  column6Html,
  isAbsent,
  hasEntered,
  hasExited,
  isUIEnabled,
  isStop,
  isDeveloperMode,
  loadingAction,
  onEnter,
  onLeave,
  onAbsence,
}) {
  const disabled =
    !isUIEnabled ||
    isStop ||
    Boolean(loadingAction)

  const afternoonBlocked =
    !hasEntered &&
    isAfternoonEnterBlocked(
      column5Html,
      childId,
      dateStr,
    )

  const enterHasMail = useMemo(
    () =>
      hasEnterMail(
        column5Html,
        childId,
        childName,
        dateStr,
      ),
    [column5Html, childId, childName, dateStr],
  )


  const showEnter =
    canPostEnter(column5Html)

  const showLeave =
    !hasExited &&
    canPostLeave(
      column6Html,
      column5,
    )

  useEffect(() => {
    console.group(
      "[AttendanceActionSection] 入退室ボタン表示判定",
    )

    console.log(
      "childId:",
      childId,
    )

    console.log(
      "childName:",
      childName,
    )

    console.log(
      "dateStr:",
      dateStr,
    )

    console.log(
      "column5:",
      column5,
    )

    console.log(
      "column5Html:",
      column5Html,
    )

    console.log(
      "column6:",
      column6,
    )

    console.log(
      "column6Html:",
      column6Html,
    )

    console.log(
      "isAbsent:",
      isAbsent,
    )

    console.log(
      "hasEntered:",
      hasEntered,
    )

    console.log(
      "hasExited:",
      hasExited,
    )

    console.log(
      "isUIEnabled:",
      isUIEnabled,
    )

    console.log(
      "isStop:",
      isStop,
    )

    console.log(
      "isDeveloperMode:",
      isDeveloperMode,
    )

    console.log(
      "loadingAction:",
      loadingAction,
    )

    console.log(
      "disabled:",
      disabled,
    )

    console.log(
      "canPostEnter(column5Html):",
      showEnter,
    )

    console.log(
      "canPostLeave(column6Html, column5):",
      showLeave,
    )

    console.log(
      "afternoonBlocked:",
      afternoonBlocked,
    )

    console.log(
      "表示結果:",
      {
        absenceBadge:
          isAbsent,

        enterTimeView:
          hasEntered,

        leaveTimeView:
          hasEntered &&
          hasExited,

        showEnterButton:
          !isAbsent &&
          !hasEntered &&
          showEnter,

        showLeaveButton:
          !isAbsent &&
          hasEntered &&
          showLeave,

        showAbsenceButton:
          !isAbsent &&
          !hasEntered &&
          isDeveloperMode,

      },
    )

    console.groupEnd()
  }, [
    childId,
    childName,
    dateStr,
    column5,
    column5Html,
    column6,
    column6Html,
    isAbsent,
    hasEntered,
    hasExited,
    isUIEnabled,
    isStop,
    isDeveloperMode,
    loadingAction,
    disabled,
    showEnter,
    showLeave,
    afternoonBlocked,
  ])

  /**
   * 欠席済み
   *
   * 専門的支援ボタンは表示するが、
   * 欠席のため使用不可。
   */
  if (isAbsent) {
    return (
      <div className="flex flex-col gap-1">
        <span
          className="hug-absence-badge"
          title={
            column5 ||
            "欠席"
          }
        >
          {column5 || "欠席"}
        </span>

      </div>
    )
  }

  /**
   * 入室済み
   */
  if (hasEntered) {
    return (
      <div className="flex flex-col gap-1">
        <div className="hug-time-fields-row">
          <div className="hug-time-field">
            <label htmlFor="hug-enter-time">
              入室
            </label>

            <input
              id="hug-enter-time"
              type="text"
              readOnly
              value={
                column5 ||
                ""
              }
            />
          </div>

          {hasExited ? (
            <div className="hug-time-field">
              <label htmlFor="hug-leave-time">
                退室
              </label>

              <input
                id="hug-leave-time"
                type="text"
                readOnly
                value={
                  column6 ||
                  ""
                }
              />
            </div>
          ) : showLeave ? (
            <div className="hug-post-actions hug-post-actions-inline">
              <LeaveButton
                childId={childId}
                childName={childName}
                dateStr={dateStr}
                hasMail={
                  hasLeaveMail(
                    column6Html,
                    childId,
                    childName,
                    dateStr,
                  )
                }
                disabled={disabled}
                loading={
                  loadingAction ===
                  "leave"
                }
                title={
                  buildLeaveButtonTitle(
                    column6Html,
                    childId,
                    dateStr,
                  )
                }
                onLeave={onLeave}
              />
            </div>
          ) : (
            <span className="hug-enter-cell-dash">
              退室ボタンなし
            </span>
          )}
        </div>

      </div>
    )
  }

  /**
   * 未入室
   *
   * 入室・欠席ボタンと一緒に
   * 専門的支援ボタンも表示する。
   *
   * この状態では専門的支援は使用不可。
   */
  return (
    <div className="flex flex-col gap-1">
      <div className="hug-post-actions hug-post-actions-inline justify-evenly gap-4">
        {showEnter ? (
          <EnterButton
            childId={childId}
            childName={childName}
            dateStr={dateStr}
            hasMail={enterHasMail}
            disabled={
              disabled ||
              afternoonBlocked
            }
            loading={
              loadingAction ===
              "enter"
            }
            title={
              buildEnterButtonTitle(
                column5Html,
                childId,
                dateStr,
              )
            }
            onEnter={onEnter}
          />
        ) : (
          <span className="hug-enter-cell-dash">
            入室ボタンなし
          </span>
        )}

        {isDeveloperMode ? (
          <AbsenceButton
            disabled={
              disabled ||
              !column5Html
            }
            loading={
              loadingAction === "absence"
            }
            onAbsence={onAbsence}
          />
        ) : null}
      </div>

      {afternoonBlocked ? (
        <p className="w-full text-xs text-orange-700">
          午後枠：ハーフタイムまで入室できません
        </p>
      ) : null}


    </div>
  )
}