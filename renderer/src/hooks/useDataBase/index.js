// banso-navi\hug-client-not-request\renderer\src\hooks\useDataBase\index.js
import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectFacilityId } from "@/store/slices/appStateSlice";
import { useAppState } from "@/AppStateContext";
import { fetchAllTables, setRecordTypes } from "@/store/slices/databaseSlice";
import { fetchLaravelAuthState } from "@/store/slices/authSlice";
import { laravelApi } from "./sql/laravelApi";

export function useDataBase({ autoLoad = false } = {}) {
  const dispatch = useDispatch();
  const facilityId = useSelector(selectFacilityId);
  const appState = useAppState();
  const resetChilledspace = appState?.resetChilledspace;
  const loadingRef = useRef(false);
  const didAutoLoadRef = useRef(false);
  const previousFacilityRef = useRef(null);

  const loadDataBase = useCallback(
    async (options = {}) => {
      if (loadingRef.current && !options.force) return false;

      loadingRef.current = true;
      try {
        const tables = await laravelApi.getAllTables(options.params ?? {});
        if (!tables || typeof tables !== "object" || Array.isArray(tables)) {
          throw new Error("Laravel APIからテーブルデータを取得できませんでした。");
        }

        // 課題タイプの取得が失敗した場合、別施設の古いデータを残さない。
        const currentFacilityId = Number(facilityId);
        if (!Number.isInteger(currentFacilityId) || currentFacilityId <= 0) {
          dispatch(setRecordTypes([]));
          throw new Error("施設IDが設定されていません。");
        }

        // 指定施設の課題タイプは __all とは別のAPIで取得する。
        // 一覧取得に失敗しても別施設の課題を誤表示しないようにする。
        dispatch(setRecordTypes([]));
        const recordTypes = await laravelApi.getRecordTypes(currentFacilityId);
        await dispatch(fetchAllTables(tables));
        dispatch(setRecordTypes(recordTypes));
        await dispatch(fetchLaravelAuthState());
        return true;
      } catch (error) {
        console.error("[useDataBase] Laravel data loading failed:", error);
        return false;
      } finally {
        loadingRef.current = false;
      }
    },
    [dispatch, facilityId],
  );

  // ✅ reloadData関数を追加
  const reloadData = useCallback(async (options = {}) => {
    console.log('[useDataBase] reloadData 開始', options);
    
    try {
      // 強制的にデータベースを再読み込み
      const result = await loadDataBase({ 
        force: true, 
        reason: options.reason || 'manual-reload',
        ...options 
      });
      
      if (result) {
        console.log('[useDataBase] reloadData 完了');
      } else {
        console.warn('[useDataBase] reloadData 失敗');
      }
      
      return result;
    } catch (error) {
      console.error('[useDataBase] reloadData エラー:', error);
      return false;
    }
  }, [loadDataBase]);

  useEffect(() => {
    if (!autoLoad || didAutoLoadRef.current || !appState?.isInitialized) return;
    didAutoLoadRef.current = true;
    previousFacilityRef.current = facilityId;
    void loadDataBase({ reason: "autoLoad" });
  }, [appState?.isInitialized, autoLoad, loadDataBase]);

  // 施設の切替後は、その施設に属する課題タイプを再取得する。
  useEffect(() => {
    if (!autoLoad || !appState?.isInitialized || !didAutoLoadRef.current) return;
    if (previousFacilityRef.current === facilityId) return;
    previousFacilityRef.current = facilityId;
    dispatch(setRecordTypes([]));
    void loadDataBase({ force: true, reason: "facility-changed" });
  }, [autoLoad, appState?.isInitialized, facilityId, dispatch, loadDataBase]);

  useEffect(() => {
    const reload = () => {
      // DB取得元が変わる前に、児童選択状態をリセットして
      // 旧DB由来の childId / activeSpaceId が残らないようにする。
      resetChilledspace?.();

      void loadDataBase({
        force: true,
        reason: "database-type-changed",
      });
    };

    window.addEventListener("database-type-changed", reload);
    return () => window.removeEventListener("database-type-changed", reload);
  }, [loadDataBase, resetChilledspace]);

  return { 
    loadDataBase,
    reloadData, // ✅ 追加
  };
}