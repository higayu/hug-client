// main/windowHandlers/handleProfessionalSupportSearch/index.js
const { createDoubleWebviewWindow } = require('./windowManager')

let isRegistered = false

function normalizeFacility(facility) {
  if (!facility || typeof facility !== 'object') return null
  if (facility.id === undefined || facility.id === null) return null

  return {
    id: facility.id,
    name: facility.name || `施設ID: ${facility.id}`,
    url: facility.url || '',
  }
}

function handleProfessionalSupportSearch(ipcMain, defaultFacilityId, defaultDateStr) {
  if (isRegistered) return
  isRegistered = true

  ipcMain.on('handle-professional-support-search', (event, args = {}) => {
    const receivedFacilityId = args.facility_id ?? defaultFacilityId
    const receivedDateStr = args.date_str ?? defaultDateStr

    const facilities = Array.isArray(args.facilitys)
      ? args.facilitys.map(normalizeFacility).filter(Boolean)
      : []

    const receivedFacilityIdText = String(receivedFacilityId ?? '')

    const targetFacility =
      normalizeFacility(args.targetFacility) ||
      facilities.find(
        (facility) => String(facility.id) === receivedFacilityIdText,
      ) ||
      null

    if (!receivedFacilityIdText) {
      console.error('❌ facility_id が指定されていません')
      return
    }

    if (!targetFacility) {
      console.error('❌ targetFacility が不正です:', args.targetFacility)
      return
    }

    // MainWindow が持つ施設一覧に初期施設が含まれていない場合も、
    // 初期施設だけは必ず ProfessionalSupportWindow に渡す。
    const hasInitialFacility = facilities.some(
      (facility) => String(facility.id) === receivedFacilityIdText,
    )

    const availableFacilities = hasInitialFacility
      ? facilities
      : [targetFacility, ...facilities]

    console.log('✅ ProfessionalSupport initial facility', targetFacility)
    console.log('✅ ProfessionalSupport facilities', availableFacilities)

    try {
      const url1 =
        'https://www.hug-ayumu.link/hug/wm/attendance.php' +
        `?mode=detail&f_id=${encodeURIComponent(receivedFacilityIdText)}` +
        `&date=${encodeURIComponent(receivedDateStr ?? '')}`

      const url2 =
        'https://www.hug-ayumu.link/hug/wm/record_proceedings.php' +
        `?f_id=${encodeURIComponent(targetFacility.id)}`

      openDoubleWebviewWithTabs(
        url1,
        url2,
        'HUGデータ取得',
        targetFacility,
        availableFacilities,
        receivedDateStr,
      )
    } catch (error) {
      console.error('❌ [MAIN] ダブルWebViewウィンドウの作成に失敗:', error)
    }
  })
}

function openDoubleWebviewWithTabs(
  url1,
  url2,
  label,
  targetFacility,
  facilities,
  dateStr,
) {
  return createDoubleWebviewWindow(
    url1,
    url2,
    label,
    null,
    targetFacility,
    facilities,
    dateStr,
  )
}

module.exports = { handleProfessionalSupportSearch }
