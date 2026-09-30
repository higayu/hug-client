export default function EditButton({ disabled = false }) {
  const handleClick = () => {
    // TODO: 編集処理は後で実装する
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className="rounded bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      編集
    </button>
  );
}
