import WebAutomationInstruction from './components/WebAutomationInstruction'
import AutomationRulesTab from './AutomationRulesTab'
import BackEndButton from './BackEndButton'
import { useSettingsRoleAccess } from '../../../useSettingsRoleAccess'

export default function WebAutomation() {
  const { isAdmin } = useSettingsRoleAccess()

  if (!isAdmin) {
    return null
  }


  return (
    <section className="space-y-4">
      <div className="flex justify-end">

        <BackEndButton />
      </div>

      <WebAutomationInstruction />

      <AutomationRulesTab />
    </section>
  )
}
