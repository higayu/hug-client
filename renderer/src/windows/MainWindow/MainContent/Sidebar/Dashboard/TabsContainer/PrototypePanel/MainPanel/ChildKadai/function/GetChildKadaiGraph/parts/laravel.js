export async function getChildKadaiGraphFromLaravel(payload) {
  const api = window.electronAPI?.laravel_procedure_getChildKadaiGraph

  if (typeof api !== 'function') {
    throw new Error('児童の課題グラフ取得APIが利用できません。')
  }

  const result = await api(payload)

  if (result?.success === false) {
    throw new Error(result.message || '児童の課題グラフ取得に失敗しました。')
  }

  return Array.isArray(result?.data) ? result.data : []
}
