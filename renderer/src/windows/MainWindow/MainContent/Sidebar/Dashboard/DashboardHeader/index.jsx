import DateSelect from "@/components/ui/DateSelect";
import WeekdaySelect from "@/components/ui/WeekdaySelect";
import FanMenuButton from "./FanMenuButton";

function DashboardHeader() {
  return (
    <div
      className="
        sidebar-header
        relative z-[100]
        flex items-center
        max-h-none
        overflow-visible
        w-full
      "
    >
      <div className="shrink-0">
        <FanMenuButton />
      </div>

      <div className="flex flex-1 min-w-0">

        {/* 日付入力：60% */}
        <div
          className="
            flex flex-row
            rounded-lg
            bg-slate-200
            p-2
            items-center
            gap-2
            basis-3/5
            min-w-0
          "
        >
          <label
            className="
              items-center
              flex flex-col
              font-bold
              text-sm
              text-black
              shrink-0
            "
          >
            <span className="text-sm text-black">
              日付:
            </span>

            <span className="text-sm text-black">
              （個人記録）
            </span>
          </label>

          <div className="flex-1 min-w-0">
            <DateSelect />
          </div>
        </div>

        {/* 曜日：40% */}
        <div
          className="
            flex flex-row
            rounded-lg
            bg-slate-200
            p-2
            items-center
            basis-2/5
            min-w-0
          "
        >
          <label
            className="
              flex flex-col
              items-center
              font-bold
              text-sm
              shrink-0
            "
          >
            <span className="text-sm text-black">
              曜日別：
            </span>

            <span className="text-sm text-black">
              （対応児童）
            </span>
          </label>

          <div className="flex-1 min-w-0">
            <WeekdaySelect />
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardHeader;
