import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FaRobot,
  FaPowerOff,
  FaSyncAlt,
  FaChild,
  FaChevronDown,
} from "react-icons/fa";

import { useAppState } from "@/AppStateContext";
import DateSelect from "@/components/ui/DateSelect";

import { useAttendanceFetch } from "./useAttendanceFetch";
import SelectChildFilter from "./SelectChildFilter";

/**
 * 最終取得日時を表示用に変換
 */
function formatLastFetchedAt(extractedAt) {
  if (!extractedAt) {
    return {
      dateTime: "未取得",
      time: "未取得",
    };
  }

  const date = new Date(extractedAt);

  if (Number.isNaN(date.getTime())) {
    return {
      dateTime: "未取得",
      time: "未取得",
    };
  }

  return {
    dateTime: date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),

    time: date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

/**
 * 児童フィルター表示名
 */
const FILTER_LABELS = {
  0: "全件",
  1: "選択施設",
  2: "欠席除外",
  3: "欠席・午前除外",
  4: "退室済みも除外",
};

/**
 * 利用者データ取得 UI
 *
 * DashboardHeader 共通機能。
 *
 * chilledspace単位ではなく、
 * Dashboard全体で1つだけ配置する。
 *
 * 表示:
 *
 * 日付:
 * [利用者] [取得時刻 / Auto / Filter ▼]
 *
 * 展開:
 * [取得] [Auto ON/OFF]
 * [日付選択]
 * [フィルター]
 */
export default function GetTodayUsersChildren({
  HideFlg = false,
  expandDirection = "up",
}) {
  const [isOpen, setIsOpen] = useState(false);

  const menuRef = useRef(null);

  const {
    attendanceData,
    SELECT_CHILD_FILTER_MODE,
  } = useAppState();

  const {
    runFetch,
    autoFetchEnabled,
    toggleAutoFetch,
  } = useAttendanceFetch(
    "GetTodayUsersChildren"
  );

  // =============================================
  // 最終取得日時
  // =============================================
  const lastFetchedAt =
    attendanceData?.extractedAt ?? null;

  const fetchedAtLabel =
    formatLastFetchedAt(lastFetchedAt);

  // =============================================
  // フィルター
  // =============================================
  const filterMode = Number(
    SELECT_CHILD_FILTER_MODE ?? 1
  );

  const filterLabel =
    FILTER_LABELS[filterMode] ??
    "選択施設";

  // =============================================
  // 展開方向
  // =============================================
  const isExpandDown =
    expandDirection === "down";

  // =============================================
  // 外側クリックで閉じる
  // =============================================
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // =============================================
  // 手動取得
  // =============================================
  const handleManualFetch = async () => {
    await runFetch();

    setIsOpen(false);
  };

  // =============================================
  // title
  // =============================================
  const statusTitle = [
    `最終取得：${fetchedAtLabel.dateTime}`,

    `自動取得：${
      autoFetchEnabled
        ? "ON"
        : "OFF"
    }`,

    !HideFlg
      ? `フィルター：${filterLabel}`
      : null,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div
      ref={menuRef}
      className="
        relative
        z-[100]
        flex
        w-full
        min-w-0
        items-center
        gap-2
      "
    >
      {/* =============================================
          日付ラベル

          以前 DashboardHeader にあった部分を
          このコンポーネントへ移動
      ============================================= */}
      <label
        className="
          flex
          shrink-0
          flex-col
          items-center
          text-sm
          font-bold
          text-black
        "
      >
        <span className="text-sm text-black">
            <div className="min-w-0 flex-1">
              <DateSelect
                id="getTodayUsersChildrenDate"
                name="getTodayUsersChildrenDate"
                className="
                  h-8
                  py-1
                  text-xs
                "
              />
            </div>
        </span>
      </label>

      {/* =============================================
          利用者取得UI本体
      ============================================= */}
      <div
        className="
          relative
          h-9
          min-w-0
          flex-1
        "
      >
        {/* =============================================
            展開メニュー
        ============================================= */}
        <div
          className={`
            absolute
            left-0
            right-0
            z-20

            ${
              isExpandDown
                ? "top-[calc(100%+4px)]"
                : "bottom-[calc(100%+4px)]"
            }

            rounded-lg
            bg-gray-800
            p-1
            shadow-lg

            transition-all
            duration-200
            ease-out

            ${
              isOpen
                ? `
                    pointer-events-auto
                    translate-y-0
                    opacity-100
                  `
                : `
                    pointer-events-none
                    opacity-0

                    ${
                      isExpandDown
                        ? "-translate-y-1"
                        : "translate-y-1"
                    }
                  `
            }
          `}
        >
          {/* =============================================
              取得 / Auto
          ============================================= */}
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={
                handleManualFetch
              }
              title="今日の利用者データを取得"
              className="
                flex
                h-8
                items-center
                justify-center
                gap-1.5
                rounded
                bg-green-600
                px-2
                text-xs
                font-semibold
                text-white
                transition
                hover:bg-green-700
              "
            >
              <FaSyncAlt size={12} />

              取得
            </button>

            <button
              type="button"
              title={
                autoFetchEnabled
                  ? "自動取得をOFFにする"
                  : "自動取得をONにする"
              }
              onClick={
                toggleAutoFetch
              }
              className={`
                flex
                h-8
                items-center
                justify-center
                gap-1.5
                rounded
                px-2
                text-xs
                font-semibold
                text-white
                transition

                ${
                  autoFetchEnabled
                    ? `
                        bg-purple-600
                        hover:bg-purple-700
                      `
                    : `
                        bg-gray-500
                        hover:bg-gray-600
                      `
                }
              `}
            >
              {autoFetchEnabled ? (
                <FaRobot size={13} />
              ) : (
                <FaPowerOff size={13} />
              )}

              Auto{" "}
              {autoFetchEnabled
                ? "ON"
                : "OFF"}
            </button>
          </div>

          {/* =============================================
              フィルター
          ============================================= */}
          {!HideFlg && (
            <div
              className="
                mt-1
                flex
                items-center
                gap-1
                rounded
                bg-white
                px-1.5
                py-1
              "
            >
              <span
                className="
                  shrink-0
                  text-[11px]
                  font-semibold
                  text-gray-600
                "
              >
                フィルター
              </span>

              <div className="min-w-0 flex-1">
                <SelectChildFilter />
              </div>
            </div>
          )}
        </div>

        {/* =============================================
            親ボタン
        ============================================= */}
        <div
          className="
            flex
            h-9
            w-full
            overflow-hidden
            rounded
            bg-gray-900
            text-xs
            text-white
            shadow-sm
          "
          title={statusTitle}
        >
          {/* =============================================
              利用者取得ボタン
          ============================================= */}
          <button
            type="button"
            onClick={
              handleManualFetch
            }
            title="今日の利用者データを取得"
            aria-label="今日の利用者データを取得"
            className="
              flex
              shrink-0
              items-center
              gap-2
              bg-green-400
              px-2.5
              font-semibold
              transition
              hover:bg-green-700

              focus:outline-none
              focus:ring-2
              focus:ring-inset
              focus:ring-green-400
            "
          >
            <FaChild
              size={14}
              className="
                shrink-0
                text-green-600
              "
            />

            <span>
              利用者
            </span>
          </button>

          {/* =============================================
              ステータス / 展開
          ============================================= */}
          <button
            type="button"
            onClick={() =>
              setIsOpen(
                (prev) => !prev
              )
            }
            aria-expanded={isOpen}
            aria-label={
              isOpen
                ? "利用者取得メニューを閉じる"
                : "利用者取得メニューを開く"
            }
            className="
              flex
              min-w-0
              flex-1
              items-center
              gap-2
              px-2.5
              transition

              hover:bg-gray-800

              focus:outline-none
              focus:ring-2
              focus:ring-inset
              focus:ring-green-400
            "
          >
            {!HideFlg && (
              <>
                <span
                  className="
                    h-4
                    w-px
                    shrink-0
                    bg-gray-600
                  "
                  aria-hidden="true"
                />

                <span
                  className="
                    min-w-0
                    truncate
                    text-gray-300
                  "
                >
                  取得

                  <span
                    className={`
                      ml-1
                      font-bold

                      ${
                        lastFetchedAt
                          ? "text-green-300"
                          : "text-red-300"
                      }
                    `}
                  >
                    {
                      fetchedAtLabel.time
                    }
                  </span>
                </span>
              </>
            )}

            <span
              className="
                ml-auto
                flex
                shrink-0
                items-center
                gap-1.5
              "
            >
              {/* Auto状態 */}
              <span
                className={`
                  rounded
                  px-1.5
                  py-0.5
                  text-[10px]
                  font-bold

                  ${
                    autoFetchEnabled
                      ? `
                          bg-purple-600
                          text-white
                        `
                      : `
                          bg-gray-600
                          text-gray-200
                        `
                  }
                `}
              >
                Auto{" "}
                {autoFetchEnabled
                  ? "ON"
                  : "OFF"}
              </span>

              {/* フィルター状態 */}
              {!HideFlg && (
                <span
                  className="
                    hidden
                    max-w-[90px]
                    truncate
                    text-[10px]
                    text-gray-300
                    xl:inline
                  "
                >
                  {filterLabel}
                </span>
              )}

              {/* 展開アイコン */}
              <FaChevronDown
                size={10}
                className={`
                  transition-transform
                  duration-200

                  ${
                    isExpandDown
                      ? isOpen
                        ? "rotate-180"
                        : ""
                      : isOpen
                        ? ""
                        : "rotate-180"
                  }
                `}
              />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}