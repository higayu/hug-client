import { getChildKadaiGraphFromLaravel } from './parts/laravel'

export async function getChildKadaiGraph({
  childrenId = null,
  recordTypeId = null,
} = {}) {
  if (!childrenId || !recordTypeId) {
    throw new Error('児童と課題のタイプは必須です。')
  }

  return getChildKadaiGraphFromLaravel({
    children_id: childrenId,
    record_type_id: recordTypeId,
  })
}

export default getChildKadaiGraph
