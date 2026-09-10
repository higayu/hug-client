import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useProfessionalSupportCheck2 } from "./useProfessionalSupportCheck2";
import { CheckCircleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  selectCurrentYmd,
  selectSelectedChild,
} from "@/store/slices/appStateSlice.js";
import { selectProfessionalSupportStatus } from "@/store/slices/recordStatusSlice.js";
import ProfessionalSupportListButton from "./ProfessionalSupportListButton";

/**
 * 専門的支援の利用日数チェック + 本日の専門的支援登録確認
 *
 * コンパクト表示:
 * - 親ボタン: 保存件数 / 本日の専門ステータス
 * - 子ボタン: チェック / 一覧
 */

const getUseDaysTextClass = (useDays) => {
  if (useDays == null) return "text-gray-300";
  return useDays >= 2 ? "text-sky-300" : "text-red-300";
};

const normalizeInterviewDateToYmd = (dateText) => {
  if (!dateText) return null;

  const match = String(dateText).match(
    /^(\d{4})年(\d{1,2})月(\d{1,2})日$/
  );

  if (!match) return null;

  const [, year, month, day] = match;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const hasTodayProfessionalSupportRecord = (useDaysResult, currentYmd) => {
  const rows = useDaysResult?.rows ?? [];

  return rows.some((row) => {
    const interviewYmd = normalizeInterviewDateToYmd(row.interviewDate);
    return interviewYmd === currentYmd;
  });
};

const professionalSupportRegisteredLabel = (
  registered,
  checking,
  useDaysResult,
  currentYmd
) => {
  if (checking) return "確認中";
  if (useDaysResult && useDaysResult.ok === false) return "失敗";
  if (registered === true) return "済";
  if (hasTodayProfessionalSupportRecord(useDaysResult, currentYmd)) return "済";
  return "未";
};

const getProfessionalSupportRegisteredClass = (
  registered,
  useDays,
  checking,
  useDaysResult,
  currentYmd
) => {
  if (checking) return "text-gray-300";
  if (useDaysResult && useDaysResult.ok === false) return "text-red-300";

  if (
    registered === true ||
    hasTodayProfessionalSupportRecord(useDaysResult, currentYmd)
  ) {
    return "text-green-300";
  }

  if (useDays != null && useDays >= 2) return "text-sky-300";

  return "text-orange-300";
};

export default function ProfessionalSupportCheckPanel2({
  className = "",
  labelClassName = "",
  logTag = "ProfessionalSupportCheck",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const currentYmd = useSelector(selectCurrentYmd);
  const selectedChildId = useSelector(selectSelectedChild);

  const professionalSupportStatus = useSelector((state) =>
    selectProfessionalSupportStatus(state, currentYmd, selectedChildId)
  );

  const { checking, runCheck } = useProfessionalSupportCheck2(logTag);

  const useDays = professionalSupportStatus.useDays;
  const useDaysDisplayKind = professionalSupportStatus.useDaysDisplayKind;
  const todayProfessionalSupportRegistered = professionalSupportStatus.registered;
  const todayProfessionalSupportRecordCount = professionalSupportStatus.recordCount;
  const lastUseDaysResult = professionalSupportStatus.lastUseDaysResult;

  useEffect(() => {
    console.log(
      `[HUG WM] ProfessionalSupportCheckPanel2 store state changed（${logTag}）`,
      {
        currentYmd,
        selectedChildId,
        useDays,
        useDaysDisplayKind,
        todayProfessionalSupportRegistered,
        todayProfessionalSupportRecordCount,
        lastUseDaysResult,
        checking,
      }
    );
  }, [
    logTag,
    currentYmd,
    selectedChildId,
    useDays,
    useDaysDisplayKind,
    todayProfessionalSupportRegistered,
    todayProfessionalSupportRecordCount,
    lastUseDaysResult,
    checking,
  ]);

  // FanMenuButton と同様に、外側クリックで子メニューを閉じる
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const useDaysTextClass = getUseDaysTextClass(useDays);

  const registeredText = professionalSupportRegisteredLabel(
    todayProfessionalSupportRegistered,
    checking,
    lastUseDaysResult,
    currentYmd
  );

  const registeredClass = getProfessionalSupportRegisteredClass(
    todayProfessionalSupportRegistered,
    useDays,
    checking,
    lastUseDaysResult,
    currentYmd
  );

  const handleCheck = () => {
    runCheck();
    setIsOpen(false);
  };

  const statusTitle = checking
    ? "専門的支援：確認中"
    : lastUseDaysResult?.ok === false
      ? "専門的支援：取得失敗"
      : `保存件数：${useDays != null ? `${useDays}個` : "未取得"} / 本日の専門：${registeredText}${todayProfessionalSupportRecordCount != null ? `（${todayProfessionalSupportRecordCount}件）` : ""}`;

  return (
    <div
      ref={menuRef}
      className={`relative z-[100] h-9 w-full ${className}`.trim()}
    >
      {/* 子ボタン: レイアウトの高さを増やさず、親ボタンの上に展開 */}
      <div
        className={`
          absolute bottom-[calc(100%+4px)] left-0 right-0 z-20
          grid grid-cols-2 gap-1
          transition-all duration-200 ease-out
          ${
            isOpen
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "translate-y-1 opacity-0 pointer-events-none"
          }
        `}
      >
        <button
          type="button"
          onClick={handleCheck}
          disabled={checking}
          title="専門的支援の保存件数と本日の登録状況を再確認"
          className="flex h-8 items-center justify-center gap-1 rounded bg-purple-600 px-2 text-xs font-semibold text-white shadow-md transition hover:bg-purple-700 disabled:opacity-60"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {checking ? "確認中" : "チェック"}
        </button>

        <ProfessionalSupportListButton className="h-8 shadow-md" />
      </div>

      {/* 親ボタン: 現在ステータスを常時表示 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={statusTitle}
        aria-expanded={isOpen}
        aria-label={
          isOpen
            ? "専門的支援メニューを閉じる"
            : "専門的支援メニューを開く"
        }
        className={`
          flex h-9 w-full items-center justify-between gap-2
          rounded bg-gray-900 px-2.5
          text-xs text-purple-300 shadow-sm
          transition hover:bg-gray-800
          focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1
          ${labelClassName}
        `.trim()}
      >
        <span className="min-w-0 truncate font-semibold">専門的支援</span>

        <span className="ml-auto flex shrink-0 items-center gap-2">
          <span className="flex items-center gap-1 text-gray-300">
            <span>保存</span>
            <span className={`flex items-center gap-0.5 font-bold ${useDaysTextClass}`}>
              {useDays != null ? `${useDays}個` : "未"}
              {useDays != null && useDays >= 2 ? (
                <CheckCircleIcon
                  className="h-3.5 w-3.5 shrink-0 text-green-300"
                  aria-label="保存件数2個以上"
                />
              ) : null}
            </span>
          </span>

          <span className="h-4 w-px bg-gray-600" aria-hidden="true" />

          <span className="flex items-center gap-1 text-gray-300">
            <span>本日</span>
            <span className={`font-bold ${registeredClass}`}>
              {registeredText}
            </span>
          </span>

          <ChevronDownIcon
            className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>
    </div>
  );
}
