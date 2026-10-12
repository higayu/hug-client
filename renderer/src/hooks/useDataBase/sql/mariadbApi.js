import { assertDatabaseEnabled } from "../databaseMode";
// src/sql/mariadbApi.js
export const mariadbApi = {
  async getAllTables() {
    assertDatabaseEnabled("mariadb");
    return await window.electronAPI.mariadb_fetchTableAll();
  },
};
