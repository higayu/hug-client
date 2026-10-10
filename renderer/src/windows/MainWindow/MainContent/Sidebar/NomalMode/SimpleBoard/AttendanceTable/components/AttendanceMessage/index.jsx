export default function AttendanceMessage({
  error,
  loading,
  hasRows,
  hasSourceRows = false,
}) {
  if (error) {
    return (
      <div
        role="alert"
        className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700"
      >
        {error}
      </div>
    );
  }

  if (!loading && !hasRows) {
    return (
      <p className="rounded border border-amber-300 bg-amber-50 p-4 text-amber-800">
        {hasSourceRows
          ? '現在のフィルタ条件に一致する児童はいません。'
          : '入退室データがありません。HUGへログインしてから更新してください。'}
      </p>
    );
  }

  return null;
}
