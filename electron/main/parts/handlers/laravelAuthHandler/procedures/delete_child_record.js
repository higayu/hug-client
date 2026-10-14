const laravelApiClient = require('../../../../../../src/laravelApiClient')
const { executeAuthenticatedOperation } = require('../auth/authenticated')
const { formatError } = require('../auth/utils')

async function handler(_event, id) {
  try {
    return await executeAuthenticatedOperation(
      () => laravelApiClient.deleteChildRecord(id),
      '児童課題記録の削除に失敗しました。',
    )
  } catch (error) {
    return formatError(error, '児童課題記録の削除に失敗しました。')
  }
}

module.exports = { handler }
