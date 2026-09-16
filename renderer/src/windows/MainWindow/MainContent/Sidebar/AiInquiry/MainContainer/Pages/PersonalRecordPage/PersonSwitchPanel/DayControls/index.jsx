// PersonalRecordManagerPanel2/DayControls.jsx

import PersonalRecordGetDayBtn from "./PersonalRecordGetDayBtn";

export default function DayControls({
  date,
  onDateChange,
  disabled = false,
  onServiceRecordsUpdated,
}) {
  const handleDateChange = (event) => {
    onDateChange(event.target.value);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <input
          type="date"
          id="personal-record-target-date"
          value={date}
          onChange={handleDateChange}
          className="
            rounded border border-gray-300
            px-3 py-1.5 bg-white
            focus:border-transparent
            focus:ring-2 focus:ring-amber-500
          "
        />
      </div>

      <PersonalRecordGetDayBtn
        dateStr={date}
        disabled={disabled}
        onServiceRecordsUpdated={onServiceRecordsUpdated}
      />
    </div>
  );
}
