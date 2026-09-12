import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import PersonalRecordButton from "@/components/common/PersonalRecordButton";

import { usePersonRecordCheck } from "./usePersonRecordCheck";

import {
  selectCurrentYmd,
} from "@/store/slices/appStateSlice.js";
import {
  selectActiveSpaceId,
  selectSpaceChildId,
} from "@/store/slices/chilledspaceSlice.js";

import { selectPersonalRecordStatus } from "@/store/slices/recordStatusSlice.js";

/**
 * 本日の個人記録登録状態ラベル
 *
 * @param {boolean | null | undefined} registered
 * @param {boolean} checking
 */
export const personalRecordRegisteredLabel = (registered, checking) => {
  if (checking) return "確認中…";
  if (registered === true) return "済";
  if (registered === false) return "未";

  return "未";
};

/**
 * 本日の個人記録登録状態の文字色
 *
 * @param {boolean | null | undefined} registered
 * @param {boolean} checking
 */
export const getPersonalRecordRegisteredClass = (registered, checking) => {
  if (checking) return "text-gray-400";

  if (registered === true) {
    return "text-green-400";
  }

  if (registered === false) {
    return "text-orange-400";
  }

  return "text-gray-400";
};

/**
 * 本日の個人記録登録状態表示
 */
export function PersonalRecordRegisteredStatus({
  registered,
  checking,
  recordCount,
}) {
  const registeredText = personalRecordRegisteredLabel(registered, checking);
  const registeredClass = getPersonalRecordRegisteredClass(
    registered,
    checking
  );

  return (
    <span
      className={`font-bold ${registeredClass}`}
      title={
        recordCount != null
          ? `記録件数：${recordCount}件`
          : "記録件数：未取得"
      }
    >
      {registeredText}
    </span>
  );
}

/**
 * 個人記録チェックパネル
 *
 * 親ボタンには現在状態のみを表示し、操作は子ボタンへまとめる。
 *
 * @param {string} className
 * @param {"up" | "down"} expandDirection
 */
export default function PersonalRecordCheckPanel({
  className = "",
  expandDirection = "up",
  spaceId,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  const activeSpaceId = useSelector(selectActiveSpaceId);
  const effectiveSpaceId = spaceId || activeSpaceId;

  const { checking, runCheck } = usePersonRecordCheck(effectiveSpaceId);

  const currentYmd = useSelector(selectCurrentYmd);
  const selectedChildId = useSelector(selectSpaceChildId(effectiveSpaceId));

  const personalRecordStatus = useSelector((state) =>
    selectPersonalRecordStatus(state, currentYmd, selectedChildId)
  );

  const todayPersonalRecordRegistered = personalRecordStatus.registered;
  const todayPersonalRecordCount = personalRecordStatus.recordCount;

  const expandUp = expandDirection !== "down";

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!panelRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleCheck = async () => {
    await runCheck();
  };

  return (
    <div
      ref={panelRef}
      className={`relative inline-flex h-9 items-center ${className}`}
    >
      {/* 展開メニュー */}
      <div
        className={[
          "absolute left-0 z-50 flex min-w-full items-center gap-1 rounded-md",
          "border border-gray-600 bg-gray-800 p-1 shadow-lg",
          "transition-all duration-150 origin-center",
          expandUp ? "bottom-full mb-1" : "top-full mt-1",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100 scale-100"
            : [
                "pointer-events-none opacity-0 scale-95",
                expandUp ? "translate-y-1" : "-translate-y-1",
              ].join(" "),
        ].join(" ")}
      >
        <button
          type="button"
          onClick={handleCheck}
          disabled={checking || !selectedChildId}
          className={[
            "inline-flex h-8 shrink-0 items-center justify-center rounded px-3",
            "text-xs font-bold whitespace-nowrap",
            "border border-green-500/40 bg-green-500/20 text-green-200",
            "hover:bg-green-500/30",
            "disabled:cursor-not-allowed disabled:opacity-40",
          ].join(" ")}
          title="本日の個人記録登録状態を確認"
        >
          {checking ? "確認中…" : "確認"}
        </button>

        <PersonalRecordButton
          disabled={!selectedChildId}
          label="個人記録"
          className="flex h-8 shrink-0 items-center justify-center rounded px-3 text-xs font-bold whitespace-nowrap"
        />
      </div>

      {/* 親ボタン */}
      <div
        className={[
          "inline-flex h-9 min-w-0 items-stretch overflow-hidden rounded-md",
          "border border-gray-600 bg-gray-800 text-xs text-gray-200",
        ].join(" ")}
      >
        {/*
          左側は展開メニュー内の「個人記録」と同じ PersonalRecordButton を利用する。
          そのため、閉じた状態でもここをクリックすれば同じ処理を実行できる。
        */}
        <div
          className="flex shrink-0 items-stretch border-r border-gray-600"
          onClick={() => setIsOpen(false)}
        >
          <PersonalRecordButton
            disabled={!selectedChildId}
            label="個人記録"
            className={[
              "flex h-full items-center justify-center rounded-none border-0 px-2",
              "text-xs font-bold whitespace-nowrap",
              "focus:outline-none focus:ring-1 focus:ring-inset focus:ring-green-400",
              "disabled:cursor-not-allowed disabled:opacity-40",
            ].join(" ")}
          />
        </div>

        {/* 右側は状態表示とメニュー開閉専用 */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={[
            "inline-flex h-full min-w-0 items-center gap-2 px-2",
            "bg-transparent text-xs text-gray-200 hover:bg-gray-700",
            "focus:outline-none focus:ring-1 focus:ring-inset focus:ring-green-400",
          ].join(" ")}
          aria-expanded={isOpen}
          title="個人記録メニューを開く"
        >
          <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
            <span className="text-gray-400">本日</span>
            <PersonalRecordRegisteredStatus
              registered={todayPersonalRecordRegistered}
              checking={checking}
              recordCount={todayPersonalRecordCount}
            />

            {todayPersonalRecordRegistered === true && (
              <CheckCircleIcon
                className="h-4 w-4 shrink-0 text-green-400"
                title="本日の個人記録登録済み"
                aria-label="本日の個人記録登録済み"
              />
            )}
          </span>

          {todayPersonalRecordCount != null && (
            <span className="shrink-0 whitespace-nowrap text-gray-400">
              {todayPersonalRecordCount}件
            </span>
          )}

          {expandUp ? (
            isOpen ? (
              <ChevronDownIcon className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronUpIcon className="h-4 w-4 shrink-0" />
            )
          ) : isOpen ? (
            <ChevronUpIcon className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 shrink-0" />
          )}
        </button>
      </div>
    </div>
  );
}
