import { useCallback, useState } from 'react'
import {
  checkAndRegisterProfessionalSupportPlus,
  checkProfessionalSupportPlusRegistration,
  registerProfessionalSupportPlus,
} from '../checks/professionalSupportPlusCheck.js'

export function useProfessionalSupportPlusCheck({
  childId,
  facilityId,
  dateStr,
  logTag = 'ProfessionalSupportManagerPanel',
  setAction,
}) {
  const [plusLoading, setPlusLoading] = useState(false)
  const [registrationCheckLoading, setRegistrationCheckLoading] = useState(false)
  const [plusRegistered, setPlusRegistered] = useState(null)
  const [plusRegistrationId, setPlusRegistrationId] = useState(null)

  const applyCheckResult = useCallback(
    (result) => {
      setPlusRegistered(result?.registered === true)
      setPlusRegistrationId(result?.registrationId || null)

      if (!result?.childFound) {
        setAction?.('warning', '対象児童が出席表に見つかりません')
      } else if (result?.registered === true) {
        setAction?.('idle', '')
      } else {
        setAction?.('warning', '専門＋ 未登録')
      }
    },
    [setAction],
  )

  const runRegistrationCheck = useCallback(
    async ({ force = false } = {}) => {
      if (
        (!force && (plusLoading || registrationCheckLoading)) ||
        registrationCheckLoading ||
        !childId ||
        !dateStr ||
        !facilityId
      ) {
        return null
      }

      setRegistrationCheckLoading(true)
      setAction?.('working', '専門＋ 登録確認中')

      try {
        const result = await checkProfessionalSupportPlusRegistration({
          childId,
          facilityId,
          dateStr,
        })

        applyCheckResult(result)
        return result
      } catch (error) {
        console.error(`[${logTag}] registration check:`, error)
        setPlusRegistered(null)
        setPlusRegistrationId(null)
        setAction?.('error', `確認失敗: ${error?.message || error}`)
        return { ok: false, error: error?.message || String(error) }
      } finally {
        setRegistrationCheckLoading(false)
      }
    },
    [
      applyCheckResult,
      childId,
      dateStr,
      facilityId,
      logTag,
      plusLoading,
      registrationCheckLoading,
      setAction,
    ],
  )

  const runRegisterOnly = useCallback(
    async ({ force = false } = {}) => {
      if (
        (!force && (plusLoading || registrationCheckLoading)) ||
        plusLoading ||
        !childId ||
        !dateStr ||
        !facilityId
      ) {
        return null
      }

      setPlusLoading(true)
      setAction?.('working', '専門＋ 登録中')

      try {
        const result = await registerProfessionalSupportPlus({
          childId,
          facilityId,
          dateStr,
        })

        setPlusRegistered(true)
        setAction?.('success', '専門＋ 登録OK')
        return result
      } catch (error) {
        console.error(`[${logTag}] plus register:`, error)
        setAction?.('error', `失敗: ${error?.message || error}`)
        return { ok: false, error: error?.message || String(error) }
      } finally {
        setPlusLoading(false)
      }
    },
    [
      childId,
      dateStr,
      facilityId,
      logTag,
      plusLoading,
      registrationCheckLoading,
      setAction,
    ],
  )

  const runCheckAndRegister = useCallback(async () => {
    if (
      plusLoading ||
      registrationCheckLoading ||
      !childId ||
      !dateStr ||
      !facilityId
    ) {
      return null
    }

    setAction?.('working', '専門＋ 登録確認中')

    try {
      const result = await checkAndRegisterProfessionalSupportPlus(
        { childId, facilityId, dateStr },
        {
          onPhase: (phase) => {
            const isRegistering = phase === 'registering'
            setRegistrationCheckLoading(!isRegistering)
            setPlusLoading(isRegistering)

            if (phase === 'checking') {
              setAction?.('working', '専門＋ 登録確認中')
            } else if (phase === 'registering') {
              setAction?.('working', '専門＋ 登録中')
            } else if (phase === 'rechecking') {
              setAction?.('working', '専門＋ 再確認中')
            }
          },
        },
      )

      const checkResult = result?.finalCheck ?? result?.initialCheck
      applyCheckResult(checkResult)
      return result
    } catch (error) {
      console.error(`[${logTag}] plus unified error:`, error)
      setPlusRegistered(null)
      setPlusRegistrationId(null)
      setAction?.('error', `失敗: ${error?.message || error}`)
      return { ok: false, error: error?.message || String(error) }
    } finally {
      setRegistrationCheckLoading(false)
      setPlusLoading(false)
    }
  }, [
    applyCheckResult,
    childId,
    dateStr,
    facilityId,
    logTag,
    plusLoading,
    registrationCheckLoading,
    setAction,
  ])

  return {
    plusLoading,
    registrationCheckLoading,
    plusRegistered,
    plusRegistrationId,
    runRegistrationCheck,
    runRegisterOnly,
    runCheckAndRegister,
  }
}
