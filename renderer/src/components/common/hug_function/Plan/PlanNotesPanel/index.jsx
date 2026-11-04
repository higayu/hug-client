import React, { useEffect, useRef } from "react";
import PersonSupportPlan from "../PersonSupportPlan";
import ProfessionalPlan from "../ProfessionalPlan";
import { fetchPersonSupportPlan } from "../PersonSupportPlan/function";
import { fetchProfessionalPlan } from "../ProfessionalPlan/fetchProfessionalPlan";

// React StrictMode の effect 再実行や同一児童の複数パネル表示での重複取得を防ぐ。
const pendingAutoFetches = new Map();

/**
 * notes が未登録のときだけ、初期表示・児童切替時に取得する。
 * 親側のデータ読み込み完了後に notesLoaded=true を渡すこと。
 * notes=null/undefined は未読込扱いにして自動取得しない。
 */
export default function PlanNotesPanel({
  childId,
  type = "individual",
  notes,
  notesLoaded = true,
  autoFetchIfEmpty = true,
  emptyText = "メモがありません",
  className = "",
  onUpdated,
  updateControl,
  facilityId,
  loadDataBase,
}) {
  const individual = type === "individual";
  const attemptedRef = useRef(new Set());
  const latestRef = useRef({ onUpdated, loadDataBase });
  latestRef.current = { onUpdated, loadDataBase };

  useEffect(() => {
    if (!autoFetchIfEmpty || !notesLoaded || notes == null || !childId || !facilityId) return;
    if (String(notes).trim() !== "") return;

    const key = `${type}:${facilityId}:${childId}`;
    if (attemptedRef.current.has(key)) return;
    attemptedRef.current.add(key);

    let promise = pendingAutoFetches.get(key);
    if (!promise) {
      promise = individual
        ? fetchPersonSupportPlan({ facilityId, selectChild: childId, loadDataBase: latestRef.current.loadDataBase })
        : fetchProfessionalPlan({ facilityId, childId, loadDataBase: latestRef.current.loadDataBase });
      pendingAutoFetches.set(key, promise);
      promise.finally(() => {
        if (pendingAutoFetches.get(key) === promise) pendingAutoFetches.delete(key);
      }).catch(() => {});
    }

    let active = true;
    promise.then((markdown) => {
      if (!active) return;
      latestRef.current.onUpdated?.(markdown);
      window.showInfoToast?.(`${individual ? "個別支援計画" : "専門的支援計画"}を自動取得しました`, 2500);
    }).catch((error) => {
      console.error(`[PlanNotesPanel] ${key} auto fetch failed`, error);
      if (active) window.showInfoToast?.(`計画の自動取得に失敗しました: ${error.message}`, 4000);
    });
    return () => { active = false; };
  }, [autoFetchIfEmpty, notesLoaded, notes, childId, facilityId, type, individual]);

  return (
    <section className={`w-full min-w-0 ${className}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-700">
          {individual ? "個別支援計画" : "専門的支援計画"}
        </span>
        {updateControl !== undefined ? updateControl : individual ? (
          <PersonSupportPlan childId={childId} facilityId={facilityId} loadDataBase={loadDataBase} onUpdated={onUpdated} />
        ) : (
          <ProfessionalPlan childId={childId} facilityId={facilityId} loadDataBase={loadDataBase} onUpdated={onUpdated} />
        )}
      </div>
      <div className="max-h-64 overflow-y-auto rounded bg-gray-700 p-2 text-xs text-white whitespace-pre-wrap">
        {notes || emptyText}
      </div>
    </section>
  );
}
