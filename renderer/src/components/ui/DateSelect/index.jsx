// renderer/src/components/ui/DateSelect.jsx

import { useAppState } from "@/AppStateContext";
import { useToast } from "@/provider/ToastProvider/ToastContext";

export default function DateSelect({
  id = "dateSelect",
  name = "dateSelect",
  className = "",
  onDateChange,
}) {
  const {
    CURRENT_YMD,
    setCurrentYmd,
  } = useAppState();

  const { showInfoToast } = useToast();

  const handleChange = (e) => {
    const selectedDate = e.target.value;

    console.log("[DateSelect] handleChange", {
      selectedDate,
      CURRENT_YMD,
    });

    if (!selectedDate) {
      return;
    }

    setCurrentYmd(selectedDate);

    // CURRENT_YMD の React state 更新完了を待たず、
    // 選択された日付そのものを呼び出し元へ渡す。
    // GetTodayUsersChildren 側では、この値を使って
    // ログイン済みHUGキャッシュから利用者一覧を再取得する。
    Promise.resolve(onDateChange?.(selectedDate)).catch((error) => {
      console.error("[DateSelect] 日付変更後処理に失敗:", error);
    });

    showInfoToast(
      `📅 日付を ${selectedDate} に設定しました`
    );
  };

  console.log("[DateSelect] render", {
    CURRENT_YMD,
  });

  return (
    <input
      id={id}
      name={name}
      type="date"
      value={CURRENT_YMD || ""}
      onChange={handleChange}
      className={`
        w-full
        min-w-0
        p-2
        border
        border-gray-300
        rounded
        text-sm
        bg-white
        text-black
        cursor-pointer
        ${className}
      `}
    />
  );
}