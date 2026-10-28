import React, { useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { fetchPersonSupportPlan } from "./function";

// 全て外部 props（Redux / AppStateへの依存なし）
export default function PersonSupportPlan({ childId, facilityId, loadDataBase, onUpdated }) {
  const [isLoading, setIsLoading] = useState(false);
  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const markdown = await fetchPersonSupportPlan({ facilityId, selectChild: childId, loadDataBase });
      onUpdated?.(markdown);
      window.showInfoToast?.("個別支援計画を取得しました", 2500);
    } catch (error) {
      console.error("[PersonSupportPlan]", error);
      window.showInfoToast?.(`取得・保存エラー: ${error.message}`, 4000);
    } finally { setIsLoading(false); }
  };
  return <button className="w-20 h-10 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded flex items-center justify-center gap-2 group" type="button" onClick={handleClick} disabled={isLoading || !childId || !facilityId} title="個別支援計画を取得">
    {isLoading ? "取得中..." : "個別"}{!isLoading && <ArrowPathIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
  </button>;
}
