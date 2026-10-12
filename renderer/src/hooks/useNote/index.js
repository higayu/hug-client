// \renderer\src\hooks\useNote\index.js
import { useAppState } from "@/AppStateContext";
import {
  saveTempNote,
  saveTempNote1,
  saveTempNote2,
  loadTempNote as loadFn,
} from "./noteUtils.js";
import { useCallback } from "react";

export function useNote() {
  const { appState } = useAppState();

  const saveTemp = useCallback(
    async (childId, memo1, memo2) => {
      const result = await saveTempNote(childId, memo1, memo2, appState);

      if (result) {
        console.log("✅ 一時メモ保存成功");
        return true;
      }

      console.error("❌ 一時メモ保存失敗");
      return false;
    },
    [
      appState.STAFF_ID,
      appState.CURRENT_DAY_OF_WEEK,
      appState.CURRENT_YMD,
      appState.DATABASE_TYPE,
    ]
  );

  const saveTemp1 = useCallback(
    async (childId, memo1) => {
      const result = await saveTempNote1(childId, memo1, appState);

      if (result) {
        console.log("✅ 一時メモ1保存成功");
        return true;
      }

      console.error("❌ 一時メモ1保存失敗");
      return false;
    },
    [
      appState.STAFF_ID,
      appState.CURRENT_DAY_OF_WEEK,
      appState.CURRENT_YMD,
      appState.DATABASE_TYPE,
    ]
  );

  const saveTemp2 = useCallback(
    async (childId, memo2) => {
      const result = await saveTempNote2(childId, memo2, appState);

      if (result) {
        console.log("✅ 一時メモ2保存成功");
        return true;
      }

      console.error("❌ 一時メモ2保存失敗");
      return false;
    },
    [
      appState.STAFF_ID,
      appState.CURRENT_DAY_OF_WEEK,
      appState.CURRENT_YMD,
      appState.DATABASE_TYPE,
    ]
  );

  const loadTemp = useCallback(
    async (childId, proxy, options) => {
      return await loadFn(childId, proxy, {
        STAFF_ID: appState.STAFF_ID,
        CURRENT_DAY_OF_WEEK: appState.CURRENT_DAY_OF_WEEK,
        DATABASE_TYPE: appState.DATABASE_TYPE,
      }, options);
    },
    [
      appState.STAFF_ID,
      appState.CURRENT_DAY_OF_WEEK,
      appState.DATABASE_TYPE,
    ]
  );

  return {
    saveTemp,
    saveTemp1,
    saveTemp2,
    loadTemp,
  };
}