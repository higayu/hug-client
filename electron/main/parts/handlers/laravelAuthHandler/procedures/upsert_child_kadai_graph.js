const laravelApiClient = require('../../../../../../src/laravelApiClient')
const { executeAuthenticatedOperation } = require('../auth/authenticated')
const { formatError, unwrapData } = require('../auth/utils')

async function upsertChildKadaiGraph(payload = {}) {
  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.upsertChildKadaiGraph(payload),
    '児童課題記録の保存に失敗しました。',
  )
  if (result?.success === false) return result
  return {
    success: true, connected: true, message: '児童課題記録を保存しました。',
    data: unwrapData(result),
    meta: { authenticated: true, reauthenticated: result?.meta?.reauthenticated ?? false },
    error: null,
  }
}

async function handler(_event, payload = {}) {
  try { return await upsertChildKadaiGraph(payload) }
  catch (error) { return formatError(error, '児童課題記録の保存に失敗しました。') }
}

module.exports = { upsertChildKadaiGraph, handler }
