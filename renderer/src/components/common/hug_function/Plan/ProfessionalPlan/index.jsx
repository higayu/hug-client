import React, { useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { fetchProfessionalPlan } from "./fetchProfessionalPlan";

// 全て外部 props（Redux / AppStateへの依存なし）
export default function ProfessionalPlan({ childId, facilityId, loadDataBase, onUpdated }) {
  const [isLoading, setIsLoading] = useState(false);
  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await fetchProfessionalPlan({ childId, facilityId, loadDataBase, onUpdated });
      window.showInfoToast?.("専門支援計画を取得し、メモ（notes2）を保存しました", 2500);
    } catch (error) {
      console.error("[ProfessionalPlan]", error);
      window.showInfoToast?.(`取得・保存エラー: ${error.message}`, 4000);
    } finally { setIsLoading(false); }
  };
  return <button className="w-40 h-10 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded flex items-center justify-center gap-2 group" type="button" onClick={handleClick} disabled={isLoading || !childId} title="専門的支援計画を取得">
    {isLoading ? "取得中..." : "計画を更新"}{!isLoading && <ArrowPathIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
  </button>;
}
