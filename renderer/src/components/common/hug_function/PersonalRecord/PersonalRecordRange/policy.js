import { selectCanAccessFacility, selectCurrentCompanyRole } from '@/store/roleSelectors'
import { selectIsGlobalAdmin, selectIsLaravelAuthenticated } from '@/store/slices/authSlice'
import { selectFacilityId } from '@/store/slices/appStateSlice'
import { selectFacilitys } from '@/store/slices/databaseSlice'

export const DAY = 86400000
export const iso = ms => new Date(ms).toISOString().slice(0, 10)
export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN
  const ms = Date.parse(value + 'T00:00:00Z')
  return Number.isFinite(ms) && iso(ms) === value ? ms : NaN
}
export function selectPersonalRecordRole(state, facilityId = selectFacilityId(state)) {
  if (!selectIsLaravelAuthenticated(state)) return null
  // ロールがあっても、対象施設に所属していなければ個人記録は取得させない。
  // null を一般職員相当として扱うと、未認可ユーザーにも7日間の実行を許してしまう。
  if (!selectCanAccessFacility(state, facilityId)) return null
  if (selectIsGlobalAdmin(state)) return 'admin'
  const facility = selectFacilitys(state).find(row => String(row.id) === String(facilityId))
  return selectCurrentCompanyRole(state, facility?.company_id)
}
export const maxRangeDays = role => role === 'admin' ? 30 : role === 'mentor' || role === 'franchise_mentor' ? 14 : role === 'staff' || role === 'franchise_staff' ? 7 : 0
export const canUseMonthly = role => role === 'admin' || role === 'mentor'
export function validatePersonalRecordFlow(state, flowKey, input) {
  const role = selectPersonalRecordRole(state, input.facilityId)
  if (!role) {
    throw new Error('選択した施設の個人記録を取得する権限がありません')
  }
  if (flowKey === 'personal_record_list_fetch' && !canUseMonthly(role)) {
    throw new Error('月単位取得はadmin・mentorのみ利用できます')
  }
  if (flowKey === 'personal_record_weekly_list_fetch') {
    const limit = maxRangeDays(role)
    const days = (parseDate(input.endDate) - parseDate(input.startDate)) / DAY + 1
    if (!(days >= 1 && days <= limit)) throw new Error(`取得期間は最大${limit}日間です`)
  }
}
