export const toId = (value) => {
  return String(value ?? '').trim()
}

export const toBoolean = (value, defaultValue = true) => {
  if (
    value === true ||
    value === 'true' ||
    value === 1 ||
    value === '1'
  ) {
    return true
  }

  if (
    value === false ||
    value === 'false' ||
    value === 0 ||
    value === '0'
  ) {
    return false
  }

  return defaultValue
}

export const isNotDeleted = (value) => {
  return Number(value ?? 0) !== 1
}

export const normalizeDatabaseType = (value) => {
  const normalized = String(value ?? '').toLowerCase()

  if (normalized === 'mariadb') {
    return 'mariadb'
  }

  if (normalized === 'laravel') {
    return 'laravel'
  }

  return 'sqlite'
}

export const createFormState = ({
  apiSettings,
  appState,
  authUser,
}) => {
  return {
    staffId: toId(
      authUser?.staff_id
    ),

    staffName: String(authUser?.name ?? ''),

    facilityId: toId(
      apiSettings?.facilityId ??
      appState?.FACILITY_ID
    ),

    databaseType: normalizeDatabaseType(
      apiSettings?.databaseType ??
      appState?.DATABASE_TYPE ??
      'sqlite'
    ),

    useAI: String(
      apiSettings?.useAI ??
      appState?.USE_AI ??
      'gemini'
    ),

    autoAttendanceFetch: toBoolean(
      apiSettings?.autoAttendanceFetch,
      false
    ),

    autoSynchronization: toBoolean(
      apiSettings?.autoSynchronization ??
      appState?.AUTO_SYNCHRONIZATION,
      true
    ),

    autoSwitching: toBoolean(
      apiSettings?.autoSwitching ??
      appState?.AUTO_SWITCHING,
      true
    ),

    professionalSupportSaveMode:
      apiSettings?.professionalSupportSaveMode === 'created'
        ? 'created'
        : 'draft',

    // 🔥 debugFlg を追加（これが抜けていた）
    debugFlg: toBoolean(
      apiSettings?.debugFlg ??
      appState?.DEBUG_FLG,
      false  // デフォルトは false
    ),
  }
}
