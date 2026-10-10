export async function upsertChildKadaiWithLaravel(payload) {
  const api = window.electronAPI?.laravel_procedure_upsertChildKadaiGraph

  if (typeof api !== 'function') {
    throw new Error('児童課題記録の保存APIが利用できません。')
  }

  const result = await api(payload)

  if (result?.success === false) {
    const validationErrors = result?.errors
      ? Object.values(result.errors).flat().join('\n')
      : ''
    throw new Error(validationErrors || result.message || '児童課題記録の保存に失敗しました。')
  }

  return result?.data ?? null
}
