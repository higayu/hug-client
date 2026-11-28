// renderer/src/sql/useManager/deleteManager/deleteManager.js

import { handleLaravelDelete } from "./parts/laravel.js";

export async function deleteManager(
  selectedChildren,
  databaseType,
  facility_id
) {
  void 0;

  void 0;

  if (!databaseType) {
    console.warn("⚠️ databaseType が設定されていません");
    void 0;
    return false;
  }

    if (databaseType === 'laravel') {
      void 0;
      const result =  await handleLaravelDelete(selectedChildren);
      if(result){
          return true;
      }
    } else {
      console.warn("⚠️ 不明な databaseType:", databaseType);
    }
  void 0;
  return false;
}
