// renderer/src/sql/useManager/deleteManager/deleteManager.js

import { handleLaravelDelete } from "./parts/laravel.js";

export async function deleteManager(
  selectedChildren,
  databaseType,
  facility_id
) {
  console.log("===== 削除Manager START =====");

  console.log("databaseType:", databaseType);

  if (!databaseType) {
    console.warn("⚠️ databaseType が設定されていません");
    console.log("===== 削除停止Manager END (error: no databaseType) =====");
    return false;
  }

    if (databaseType === 'laravel') {
      console.log("→ 使用DB: Laravel API");
      const result =  await handleLaravelDelete(selectedChildren);
      if(result){
          return true;
      }
    } else {
      console.warn("⚠️ 不明な databaseType:", databaseType);
    }
  console.log("===== 削除Manager END =====");
  return false;
}
