import { upsertChildKadaiWithLaravel } from './parts/laravel'

export function upsertChildKadai(payload) {
  return upsertChildKadaiWithLaravel({
    id: payload?.id ?? null,
    children_id: payload?.children_id,
    record_type_id: payload?.record_type_id,
    date: payload?.date,
    score: payload?.score ?? null,
    mistakes: payload?.mistakes ?? null,
    facility_id: payload?.facility_id,
    memo1: payload?.memo1 ?? null,
    memo2: payload?.memo2 ?? null,
  })
}

export default upsertChildKadai
