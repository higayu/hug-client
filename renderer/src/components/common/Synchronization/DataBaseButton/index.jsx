// renderer/src/components/common/Synchronization/DataBaseButton/index.jsx

import { Database } from "lucide-react"
import { useDataBase } from "@/hooks/useDataBase"
import { useToast } from '@/utils/notifications.jsx'

export default function DataBaseButton({ className = "" }) {
  const { showInfoToast, showErrorToast } = useToast()

  // 重要:
  // autoLoad は付けない
  // このボタンは「クリック時だけ再取得」するため
  const { loadDataBase } = useDataBase()

  const handleClick = async () => {
    try {
      const result = await loadDataBase({
        reason: "manual/DataBaseButton",
      })

      if (result) {
        showInfoToast("再取得OK")
      } else {
        showErrorToast("再取得できませんでした")
      }
    } catch (error) {
      console.error("❌ DataBaseButton 再取得エラー:", error)
      showErrorToast("エラー")
    } finally {
      console.log("取得処理終了")
    }
  }

  return (
    <button
      type="button"
      className={`${className} bg-red-300 hover:bg-red-500 inline-flex justify-center items-center text-gray-700 gap-2`}
      onClick={handleClick}
    >
      <Database size={18} />
      再取得
    </button>
  )
}