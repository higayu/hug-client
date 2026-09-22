import WebAutomationInstruction from './components/WebAutomationInstruction'
import AutomationRulesTab from './AutomationRulesTab'

export default function WebAutomation() {
  return (
    <section className="space-y-4">
      <WebAutomationInstruction />

      <AutomationRulesTab />
    </section>
  )
}
