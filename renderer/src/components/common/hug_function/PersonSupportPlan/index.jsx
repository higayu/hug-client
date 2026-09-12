import React, { useState } from "react";
import { useAppState } from "@/AppStateContext";
import { useSelector } from "react-redux";
import { selectSpaceChildId } from "@/store/slices/chilledspaceSlice.js";
import { useDataBase } from "@/hooks/useDataBase";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { fetchPersonSupportPlan } from "./function";

export default function PersonSupportPlan({ spaceId }) {
  const { FACILITY_ID: facilityId } = useAppState();
  const selectedChildId = useSelector(selectSpaceChildId(spaceId));
  const { loadDataBase } = useDataBase();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetPersonSupportPlan = async () => {
    setIsLoading(true);
    try {
      await fetchPersonSupportPlan({
        facilityId,
        selectChild: selectedChildId,
        loadDataBase,
      });
    } catch (error) {
      console.error("[HUG WM] エラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        className="w-20 h-10 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded flex items-center justify-center gap-2 group"
        type="button"
        onClick={handleGetPersonSupportPlan}
        disabled={isLoading}
        title="個別支援計画を取得"
      >
        {isLoading ? "取得中..." : "個別"}
        {!isLoading && <ArrowPathIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
      </button>
    </div>
  );
}
