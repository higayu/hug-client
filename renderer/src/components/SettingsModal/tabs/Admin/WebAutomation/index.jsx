import WebAutomationInstruction from './components/WebAutomationInstruction'
import AutomationRulesTab from './AutomationRulesTab'

export default function WebAutomation() {
  const openPhpMyAdmin = async () => {
    try {
      const result = await window.electronAPI?.openPhpMyAdminWindow?.()

      if (!result || result.success === false) {
        throw new Error(
          result?.error || 'phpMyAdminウィンドウを開けませんでした。',
        )
      }
    } catch (error) {
      console.error('[WebAutomation] phpMyAdmin起動エラー:', error)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openPhpMyAdmin}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
        >
          phpMyAdminを開く
        </button>
      </div>

      <WebAutomationInstruction />

      <AutomationRulesTab />
    </section>
  )
}
