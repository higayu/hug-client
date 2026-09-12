import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAppState } from "@/AppStateContext";
import {
  selectCurrentYmd,
  selectFacilityId,
} from "@/store/slices/appStateSlice.js";
import {
  selectActiveSpaceId,
  selectSpaceChildId,
} from "@/store/slices/chilledspaceSlice.js";
import {
  setPersonalRecordStatus,
  setRecordStatusError,
} from "@/store/slices/recordStatusSlice.js";
import { fetchPersonalRecord } from "@/utils/fetchPersonalRecord";
import { parseTodayPersonalRecordStatus } from "./parseTodayPersonalRecordStatus";

/**
 * 個人記録 本日登録チェック
 * @param {string} [logTag]
 */
export function usePersonRecordCheck(spaceId, logTag = "PersonalRecordCheck") {
  const dispatch = useDispatch();

  const { FACILITY_ID, CURRENT_YMD } = useAppState();

  const activeSpaceId = useSelector(selectActiveSpaceId);
  const effectiveSpaceId = spaceId || activeSpaceId;
  const selectedChildIdFromStore = useSelector(
    selectSpaceChildId(effectiveSpaceId)
  );
  const facilityIdFromStore = useSelector(selectFacilityId);
  const currentYmdFromStore = useSelector(selectCurrentYmd);

  const effectiveChildId = selectedChildIdFromStore;
  const effectiveFacilityId = facilityIdFromStore || FACILITY_ID || "3";
  const effectiveCurrentYmd = currentYmdFromStore || CURRENT_YMD;

  const [todayPersonalRecordRegistered, setTodayPersonalRecordRegistered] =
    useState(null);
  const [todayPersonalRecordCount, setTodayPersonalRecordCount] =
    useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setTodayPersonalRecordRegistered(null);
    setTodayPersonalRecordCount(null);
  }, [effectiveChildId, effectiveCurrentYmd]);

  const runCheck = useCallback(async () => {
    if (!effectiveChildId) {
      alert("子どもを選択してください");
      return;
    }

    setChecking(true);
    setTodayPersonalRecordRegistered(null);
    setTodayPersonalRecordCount(null);

    try {
      const contactResult = await fetchPersonalRecord({
        childId: effectiveChildId,
        facilityId: effectiveFacilityId,
        currentYmd: effectiveCurrentYmd,
      });

      if (!contactResult.ok) {
        console.error(
          `[${logTag}] 本日の個人記録確認失敗:`,
          contactResult.error
        );

        dispatch(
          setRecordStatusError({
            ymd: effectiveCurrentYmd,
            childId: effectiveChildId,
            kind: "personalRecord",
            error: contactResult.error || "本日の個人記録の確認に失敗しました",
          })
        );

        alert(contactResult.error || "本日の個人記録の確認に失敗しました");
        return;
      }

      const { registered, recordCount } =
        parseTodayPersonalRecordStatus(contactResult);

      setTodayPersonalRecordRegistered(registered);
      setTodayPersonalRecordCount(recordCount);

      dispatch(
        setPersonalRecordStatus({
          ymd: effectiveCurrentYmd,
          childId: effectiveChildId,
          registered,
          recordCount,
        })
      );

      console.log(`[HUG WM] 本日の個人記録（${logTag}）`, {
        registered,
        recordCount,
        records: contactResult.records,
      });
    } catch (e) {
      console.error(`[${logTag}] 個人記録チェック例外:`, e);

      dispatch(
        setRecordStatusError({
          ymd: effectiveCurrentYmd,
          childId: effectiveChildId,
          kind: "personalRecord",
          error: String(e?.message || e),
        })
      );

      alert(String(e?.message || e));
    } finally {
      setChecking(false);
    }
  }, [
    dispatch,
    effectiveChildId,
    effectiveFacilityId,
    effectiveCurrentYmd,
    logTag,
  ]);

  return {
    todayPersonalRecordRegistered,
    todayPersonalRecordCount,
    checking,
    runCheck,
  };
}