export default async function deleteChildKadai(id) {
  const api = window.electronAPI?.laravel_childRecord_delete

  if (!id || typeof api !== 'function') {
    throw new Error('児童課題記録の削除APIが利用できません。')
  }

  const result = await api(id)
  if (result?.success === false) {
    throw new Error(result.message || '児童課題記録の削除に失敗しました。')
  }

  return result
}
