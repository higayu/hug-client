// import { usePatchChildUseSpeDate } from "@/components/common/hug_function/GetTodayUsersChildren/SelectChildFilter/usePatchChildUseSpeDate";

import { useCallback } from "react"

/**
 * TodayChildrenList などで保持している抽出済み児童データの
 * useSpeDate を安全に更新する専用 hook。
 *
 * 方針:
 * - AppState の childrenData / waiting_childrenData / Experience_childrenData は使わない
 * - databaseSlice も直接書き換えない
 * - 表示用に抽出したローカルStateだけを patch する
 *
 * 想定する state 形:
 * {
 *   week_children: [],
 *   waiting_children: [],
 *   Experience_children: [],
 * }
 */
export function usePatchChildUseSpeDate({ setSplitChildren } = {}) {
  const patchChildUseSpeDate = useCallback(
    (childId, useSpeDate) => {
      if (!childId) {
        console.warn("[usePatchChildUseSpeDate] childId が空です")
        return
      }

      if (typeof setSplitChildren !== "function") {
        console.warn(
          "[usePatchChildUseSpeDate] setSplitChildren が関数ではありません"
        )
        return
      }

      const targetId = String(childId)

      const patchList = (list) => {
        if (!Array.isArray(list)) {
          return []
        }

        return list.map((child) => {
          if (String(child?.children_id) !== targetId) {
            return child
          }

          return {
            ...child,
            useSpeDate,
          }
        })
      }

      setSplitChildren((prev) => {
        const safePrev = prev || {}

        const prevWeekChildren = Array.isArray(safePrev.week_children)
          ? safePrev.week_children
          : []

        const prevWaitingChildren = Array.isArray(safePrev.waiting_children)
          ? safePrev.waiting_children
          : []

        const prevExperienceChildren = Array.isArray(
          safePrev.Experience_children
        )
          ? safePrev.Experience_children
          : []

        const nextWeekChildren = patchList(prevWeekChildren)
        const nextWaitingChildren = patchList(prevWaitingChildren)
        const nextExperienceChildren = patchList(prevExperienceChildren)

        console.log("[usePatchChildUseSpeDate] useSpeDate patch", {
          childId: targetId,
          useSpeDate,
          before: {
            weekChildrenLength: prevWeekChildren.length,
            waitingChildrenLength: prevWaitingChildren.length,
            experienceChildrenLength: prevExperienceChildren.length,
          },
          after: {
            weekChildrenLength: nextWeekChildren.length,
            waitingChildrenLength: nextWaitingChildren.length,
            experienceChildrenLength: nextExperienceChildren.length,
          },
        })

        return {
          ...safePrev,
          week_children: nextWeekChildren,
          waiting_children: nextWaitingChildren,
          Experience_children: nextExperienceChildren,
        }
      })
    },
    [setSplitChildren]
  )

  return {
    patchChildUseSpeDate,
  }
}