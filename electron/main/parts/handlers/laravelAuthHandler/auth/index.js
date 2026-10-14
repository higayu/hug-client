// main/parts/handlers/laravelAuthHandler/auth/index.js

const login = require('./login');
const me = require('./me');
const logout = require('./logout');
const fetchAllTables = require('./fetchAllTables');
const { formatError, formatClientFailure } = require('./utils');
const { executeAuthenticatedOperation } = require('./authenticated');  // 追加

module.exports = {
  loginHandler: login.handler,
  meHandler: me.handler,
  logoutHandler: logout.handler,
  fetchAllTables: fetchAllTables.handler,
  formatError,
  formatClientFailure,
  executeAuthenticatedOperation,  // 追加
};