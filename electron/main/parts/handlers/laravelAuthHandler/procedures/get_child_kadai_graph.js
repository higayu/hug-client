const laravelApiClient = require('../../../../../../src/laravelApiClient')
const { executeAuthenticatedOperation } = require('../auth/authenticated')
const { formatError, unwrapData } = require('../auth/utils')

async function getChildKadaiGraph(payload = {}) {
  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.getChildKadaiGraph(payload),
    '児童の課題グラフデータ取得に失敗しました。',
  )

  if (result?.success === false) return result

  return {
    success: true,
    connected: true,
    message: '児童の課題グラフデータを取得しました。',
    data: unwrapData(result),
    meta: {
      authenticated: true,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  }
}

async function handler(_event, payload = {}) {
  try {
    return await getChildKadaiGraph(payload)
  } catch (error) {
    console.error('[Laravel Procedure] getChildKadaiGraph error:', error)
    return formatError(error, '児童の課題グラフデータ取得に失敗しました。')
  }
}

module.exports = { getChildKadaiGraph, handler }
