const { laravelTables } = require("./tables");

function createTableApis(ipcRenderer) {
  const tableApis = {};

  for (const table of laravelTables) {
    tableApis[`laravel_${table}_getAll`] = () =>
      ipcRenderer.invoke(`laravel:${table}:getAll`);

    tableApis[`laravel_${table}_getById`] = (id, pk = "id") =>
      ipcRenderer.invoke(`laravel:${table}:getByPk`, { pk, values: id });

    tableApis[`laravel_${table}_getByPk`] = ({ pk, values }) =>
      ipcRenderer.invoke(`laravel:${table}:getByPk`, { pk, values });

    tableApis[`laravel_${table}_insert`] = (data) =>
      ipcRenderer.invoke(`laravel:${table}:insert`, data);

    tableApis[`laravel_${table}_update`] = ({ pk, values, data }) =>
      ipcRenderer.invoke(`laravel:${table}:update`, { pk, values, data });

    tableApis[`laravel_${table}_delete`] = ({ pk, values }) =>
      ipcRenderer.invoke(`laravel:${table}:delete`, { pk, values });

    tableApis[`laravel_${table}_upsert`] = (data) =>
      ipcRenderer.invoke(`laravel:${table}:upsert`, data);
  }

  return tableApis;
}

module.exports = { createTableApis };
