export default function AdminHeader() {
  return (
    <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
      <h3 className="text-lg font-semibold text-blue-900">
        管理者設定
      </h3>
      <p className="mt-1 text-sm text-blue-800">
        管理者だけが操作できる設定を、この画面内で切り替えて編集します。
      </p>
    </div>
  )
}
