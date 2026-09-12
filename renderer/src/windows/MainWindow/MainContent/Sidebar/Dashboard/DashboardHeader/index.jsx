import WeekdaySelect from "@/components/ui/WeekdaySelect";
import FanMenuButton from "./FanMenuButton";
import GetTodayUsersChildren from "./GetTodayUsersChildren";

function DashboardHeader() {
  return (
    <div
      className="
        sidebar-header
        relative
        z-[100]
        flex
        w-full
        max-h-none
        items-center
        overflow-visible
      "
    >
      {/* =============================================
          ファンメニュー
      ============================================= */}
      <div className="shrink-0">
        <FanMenuButton />
      </div>

      <div className="flex min-w-0 flex-1">
        {/* =============================================
            日付・利用者取得：60%

            日付ラベルを含めて
            GetTodayUsersChildren 側で管理する
        ============================================= */}
        <div
          className="
            flex
            min-w-0
            basis-3/5
            flex-row
            items-center
            gap-2
            rounded-lg
            bg-slate-200
            p-2
          "
        >
          <GetTodayUsersChildren expandDirection="down" />
        </div>

        {/* =============================================
            曜日：40%
        ============================================= */}
        <div
          className="
            flex
            min-w-0
            basis-2/5
            flex-row
            items-center
            rounded-lg
            bg-slate-200
            p-2
          "
        >
          <label
            className="
              flex
              shrink-0
              flex-col
              items-center
              text-sm
              font-bold
            "
          >
            <span className="text-sm text-black">
              曜日別：
            </span>

            <span className="text-sm text-black">
              （対応児童）
            </span>
          </label>

          <div className="min-w-0 flex-1">
            <WeekdaySelect />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHeader;