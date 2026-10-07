import {
  executeProfessionalSupportPlusRegister,
  executeProfessionalSupportPlusRegistrationCheck,
} from '../professionalSupportWebAutomation.js'

export async function checkProfessionalSupportPlusRegistration({
  childId,
  facilityId,
  dateStr,
}) {
  return executeProfessionalSupportPlusRegistrationCheck({
    childId,
    facilityId,
    dateStr,
  })
}

export async function registerProfessionalSupportPlus({
  childId,
  facilityId,
  dateStr,
}) {
  return executeProfessionalSupportPlusRegister({
    childId,
    facilityId,
    dateStr,
  })
}

/**
 * 専門＋の登録状態を確認し、未登録の場合だけ登録して再確認する。
 *
 * onPhase:
 * - checking: 初回確認
 * - registering: 未登録のため登録中
 * - rechecking: 登録後の再確認
 */
export async function checkAndRegisterProfessionalSupportPlus(
  { childId, facilityId, dateStr },
  { onPhase } = {},
) {
  onPhase?.('checking')
  const initialCheck = await checkProfessionalSupportPlusRegistration({
    childId,
    facilityId,
    dateStr,
  })

  if (!initialCheck?.ok || !initialCheck?.childFound) {
    return {
      ok: initialCheck?.ok === true,
      registeredNow: false,
      initialCheck,
      finalCheck: initialCheck,
      registerResult: null,
    }
  }

  if (initialCheck.registered === true) {
    return {
      ok: true,
      registeredNow: false,
      initialCheck,
      finalCheck: initialCheck,
      registerResult: null,
    }
  }

  onPhase?.('registering')
  const registerResult = await registerProfessionalSupportPlus({
    childId,
    facilityId,
    dateStr,
  })

  onPhase?.('rechecking')
  const finalCheck = await checkProfessionalSupportPlusRegistration({
    childId,
    facilityId,
    dateStr,
  })

  return {
    ok: finalCheck?.ok === true,
    registeredNow: true,
    initialCheck,
    registerResult,
    finalCheck,
  }
}
