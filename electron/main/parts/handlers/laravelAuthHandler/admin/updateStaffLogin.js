const laravelApiClient = require('../../../../../../src/laravelApiClient')
const { executeAuthenticatedOperation } = require('../auth/authenticated')
const { formatError } = require('../auth/utils')

const handler = async (_event, payload = {}) => {
  try {
    return await executeAuthenticatedOperation(
      () => laravelApiClient.updateStaffLogin(
        payload.staffId,
        {
          login_id: payload.login_id,
          password: payload.password,
          password_confirmation: payload.password_confirmation,
        },
      ),
      'ログイン情報の更新に失敗しました。',
    )
  } catch (error) {
    return formatError(error, 'ログイン情報の更新に失敗しました。')
  }
}

module.exports = { handler }
