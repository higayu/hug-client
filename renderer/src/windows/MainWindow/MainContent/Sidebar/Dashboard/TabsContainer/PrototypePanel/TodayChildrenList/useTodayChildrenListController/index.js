// src/components/Sidebar/SelectChildrenList/TodayChildrenList/useTodayChildrenListController.js
// 選択児童のフィルタリング処理
import { useCallback, useEffect, useMemo } from "react"
import {
  getAttendanceItemForChild,
  isChildAbsent,
  isChildExited,
} from "@/utils/attendance/helpers/attendanceStatus.js";
import { TABS } from "@/components/common/constants";

import { isMorningChild } from "./timeUtils";
import { useAppState } from '@/AppStateContext';

export function useTodayChildrenListController({
  SELECT_CHILD,
  SELECT_CHILD_FILTER_MODE,
  childrenData,
  waiting_childrenData,
  Experience_childrenData,
  attendanceData,
  activeTab,
  setDoneChildIds,
  setSelectedChild,
  setSelectedPcName,
}) {
  const { STAFF_ID, FACILITY_ID, CURRENT_DAY_OF_WEEK, appState } = useAppState();

  // ==============================
  // AppState 側の命名を画面側で扱いやすい名前に寄せる
  // ==============================
  const weekChildrenData = useMemo(() => {
    return Array.isArray(childrenData) ? childrenData : []
  }, [childrenData])

  const waitingChildrenData = useMemo(() => {
    return Array.isArray(waiting_childrenData) ? waiting_childrenData : []
  }, [waiting_childrenData])

  const experienceChildrenData = useMemo(() => {
    return Array.isArray(Experience_childrenData) ? Experience_childrenData : []
  }, [Experience_childrenData])

  const handleToggleDone = useCallback(
    (child, checked) => {

      setDoneChildIds((prev) => {
        const next = checked
          ? [...new Set([...prev, child.children_id])]
          : prev.filter((id) => id !== child.children_id)

        return next
      })
    },
    [setDoneChildIds]
  )

  const getAttendanceItem = useCallback(
    (childId) => {
      const attendanceItem = getAttendanceItemForChild(attendanceData, childId)

      return attendanceItem
    },
    [attendanceData]
  )

  /**
   * 施設IDによるフィルタリング判定
   */
  const isSameFacility = useCallback((child) => {
    if (!child) return false
    
    const childFacilityId = child.facility_id
    const currentFacilityId = Number(FACILITY_ID)
    
    if (childFacilityId != null && currentFacilityId != null) {
      return Number(childFacilityId) === currentFacilityId
    }
    
    // facility_id が存在しない場合は表示しない（安全側に倒す）
    return false
  }, [FACILITY_ID])

  const isChildVisible = useCallback(
    (child) => {
      if (!child) {
        return false
      }

      const mode = Number(SELECT_CHILD_FILTER_MODE ?? 1) // デフォルトを 1 に変更
      const attendanceItem = getAttendanceItem(child.children_id)

      const absent = isChildAbsent(attendanceItem)
      const exited = isChildExited(attendanceItem)
      const morning = isMorningChild(child)
      
      // 施設IDによるフィルタリング（全モード共通）
      const facilityMatch = isSameFacility(child)

      let visible = true

      // 0: 全件表示（施設フィルタリングのみ適用）
      if (mode === 0) {
        visible = facilityMatch
      }

      // 1: 施設で抽出
      else if (mode === 1) {
        visible = facilityMatch
      }

      // 2: 欠席を除く + 施設フィルタリング
      else if (mode === 2) {
        visible = facilityMatch && !absent
      }

      // 3: 欠席・午前を除く + 施設フィルタリング
      else if (mode === 3) {
        visible = facilityMatch && !absent && !morning
      }

      // 4: 欠席・午前・退室済みを除く + 施設フィルタリング
      else if (mode === 4) {
        visible = facilityMatch && !absent && !morning && !exited
      }

      return visible
    },
    [getAttendanceItem, SELECT_CHILD_FILTER_MODE, isSameFacility]
  )

  const getChildAbsent = useCallback(
    (child) => {
      if (!child) {
        return false
      }

      const result = isChildAbsent(getAttendanceItem(child.children_id))

      return result
    },
    [getAttendanceItem]
  )

  const getChildExited = useCallback(
    (child) => {
      if (!child) {
        return false
      }

      const result = isChildExited(getAttendanceItem(child.children_id))

      return result
    },
    [getAttendanceItem]
  )

  const filterVisibleChildren = useCallback(
    (children) => {
      const list = Array.isArray(children) ? children : []
      const filtered = list.filter(isChildVisible)

      return filtered
    },
    [isChildVisible, SELECT_CHILD_FILTER_MODE]
  )

  // ==============================
  // priority 別に分類
  // ==============================
  const {
    normalChildren,
    sometimesChildren,
    temporaryChildren,
  } = useMemo(() => {
    const base = Array.isArray(weekChildrenData) ? weekChildrenData : []

    const result = {
      normalChildren: filterVisibleChildren(
        base.filter((child) => Number(child.priority ?? 0) === 0)
      ),
      sometimesChildren: filterVisibleChildren(
        base.filter((child) => Number(child.priority ?? 0) === 1)
      ),
      temporaryChildren: filterVisibleChildren(
        base.filter((child) => Number(child.priority ?? 0) === 2)
      ),
    }

    return result
  }, [weekChildrenData, filterVisibleChildren])

  const visibleWaitingChildren = useMemo(() => {
    const result = filterVisibleChildren(waitingChildrenData)



    return result
  }, [waitingChildrenData, filterVisibleChildren])

  const visibleExperienceChildren = useMemo(() => {
    const result = filterVisibleChildren(experienceChildrenData)

    return result
  }, [experienceChildrenData, filterVisibleChildren])

  const getVisibleChildrenForTab = useCallback(
    (tab) => {
      let result = []

      switch (tab) {
        case TABS.NORMAL:
          result = normalChildren
          break

        case TABS.SOMETIMES:
          result = sometimesChildren
          break

        case TABS.TEMPORARY:
          result = temporaryChildren
          break

        case TABS.WAITING:
          result = visibleWaitingChildren
          break

        case TABS.EXPERIENCE:
          result = visibleExperienceChildren
          break

        default:
          result = []
          break
      }

      return result
    },
    [
      normalChildren,
      sometimesChildren,
      temporaryChildren,
      visibleWaitingChildren,
      visibleExperienceChildren,
    ]
  )

  // ==============================
  // 初期選択
  // 重要:
  // - 通常タブ表示中だけ自動選択する
  // - 空のキャンセル/体験タブで SELECT_CHILD を空にした直後に、
  //   通常児童を勝手に再選択すると無限ループになるため
  // ==============================
  useEffect(() => {

    if (activeTab !== TABS.NORMAL) {
      return
    }

    if (SELECT_CHILD || normalChildren.length === 0) {
      return
    }

    const first = normalChildren[0]

    setSelectedChild(first.children_id, first.children_name)
    setSelectedPcName(first.pc_name || "")

    if (window.AppState) {
      window.AppState.SELECT_CHILD = first.children_id
      window.AppState.SELECT_CHILD_NAME = first.children_name
      window.AppState.SELECT_PC_NAME = first.pc_name || ""
    }
  }, [
    activeTab,
    normalChildren,
    SELECT_CHILD,
    setSelectedChild,
    setSelectedPcName,
  ])

  // ==============================
  // フィルタ変更時:
  // 欠席・午前・退室済みなどで非表示になった児童の選択を変更
  //
  // 重要:
  // - 現在タブに表示児童が0件の場合、SELECT_CHILDを解除しない
  // - 解除すると「通常タブの初期選択」と衝突して無限ループになる
  // ==============================
  useEffect(() => {
    if (!SELECT_CHILD) {
      return
    }

    const visibleChildren = getVisibleChildrenForTab(activeTab)

    if (visibleChildren.length === 0) {
      return
    }

    const selectedStillVisible = visibleChildren.some(
      (child) => String(child.children_id) === String(SELECT_CHILD)
    )

    if (selectedStillVisible) {
      return
    }

    const first = visibleChildren[0]

    setSelectedChild(first.children_id, first.children_name)
    setSelectedPcName(first.pc_name || "")

    if (window.AppState) {
      window.AppState.SELECT_CHILD = first.children_id
      window.AppState.SELECT_CHILD_NAME = first.children_name
      window.AppState.SELECT_PC_NAME = first.pc_name || ""
    }
  }, [
    SELECT_CHILD,
    SELECT_CHILD_FILTER_MODE,
    activeTab,
    getVisibleChildrenForTab,
    setSelectedChild,
    setSelectedPcName,
  ])

  // ==============================
  // 子ども選択
  // ==============================
  const handleChildSelect = useCallback(
    (childId, childName, pcName = "") => {

      setSelectedChild(childId, childName)
      setSelectedPcName(pcName || "")

      if (window.AppState) {
        window.AppState.SELECT_CHILD = childId
        window.AppState.SELECT_CHILD_NAME = childName
        window.AppState.SELECT_PC_NAME = pcName || ""

      }
    },
    [
      SELECT_CHILD,
      setSelectedChild,
      setSelectedPcName,
    ]
  )

  // ==============================
  // title
  // ==============================
  const getChildNotesTitle = useCallback((child) => {
    const notes3 = child?.notes3?.trim()
    return notes3 || undefined
  }, [])

  return {
    weekChildrenData,
    waitingChildrenData,
    experienceChildrenData,

    normalChildren,
    sometimesChildren,
    temporaryChildren,
    visibleWaitingChildren,
    visibleExperienceChildren,

    handleChildSelect,
    handleToggleDone,
    getChildNotesTitle,
    getChildAbsent,
    getChildExited,
  }
}
