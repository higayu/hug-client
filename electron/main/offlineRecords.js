const client = require('../../src/laravelApiClient');
const { executeAuthenticatedOperation } = require('./parts/handlers/laravelAuthHandler/auth/authenticated');

function registerOfflineRecords(ipcMain) {
  const operations = {
    list: payload => client.get('/hug-outage-records', { params: payload }),
    save: payload => client.post('/hug-outage-records', payload),
    deleteTransferred: payload => client.post('/hug-outage-records/delete-transferred', payload),
  };
  for (const [action, operation] of Object.entries(operations)) {
    ipcMain.handle(`offline-records:${action}`, (_event, payload) =>
      executeAuthenticatedOperation(() => operation(payload), 'サーバ停止中の記録をLaravelで処理できませんでした。'));
  }
}
module.exports = { registerOfflineRecords };
