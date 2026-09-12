import WeekdaySelect from "@/components/ui/WeekdaySelect";
import FanMenuButton from "./FanMenuButton";
import GetTodayUsersChildren from "./GetTodayUsersChildren";
import AddChilledSpace from "./AddChilledSpace";

function DashboardHeader() {
  return (
    <div
      className="
        sidebar-header
        relative
        z-[100]
        flex
        w-full
        items-center
        gap-2
        overflow-visible
      "
    >
      {/* ファンメニュー */}
      <div className="shrink-0">
        <FanMenuButton />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* 日付・利用者取得 */}
        <div
          className="
            flex
            min-w-0
            basis-3/5
            items-center
            rounded-lg
            bg-slate-200
            p-2
          "
        >
          <GetTodayUsersChildren expandDirection="down" />
        </div>

        {/* 曜日 */}
        <div
          className="
            flex
            min-w-0
            basis-2/5
            items-center
            gap-2
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
              justify-center
              text-sm
              font-bold
              text-black
            "
          >
            <span>曜日別：</span>
            <span>（対応児童）</span>
          </label>

          <div className="min-w-0 flex-1">
            <WeekdaySelect />
          </div>

          <div className="flex shrink-0 items-center justify-center">
            <AddChilledSpace />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHeader;