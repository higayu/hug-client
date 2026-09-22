import AccountInfoPanel from '@/components/ui/AccountInfoPanel'

export default function SideBar({ config }) {
  const items = [
    {
      label: '',
      value: String(config?.PHP_MY_ADMIN_USER ?? ''),
    },
    {
      label: '',
      value: String(config?.PHP_MY_ADMIN_PASSWORD ?? ''),
    },
  ]

  return (
    <aside className="h-full w-full overflow-y-auto border-r border-slate-700 bg-slate-800 p-4 text-white">
      <h2 className="text-base font-bold">phpMyAdminログイン情報</h2>
      <p className="mb-4 mt-1 text-xs leading-5 text-slate-300">
        認証画面へ手入力する際にコピーして使用できます。
      </p>
      <AccountInfoPanel title="アカウント情報" items={items} isOpen />
    </aside>
  )
}
