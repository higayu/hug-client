// main/parts/handlers/mariadbHandler/mariadb/crud/managers2.js
const apiClient = require("../../../../../../src/apiClient");

/**
 * 空判定
 * 0 は有効な値として扱う
 */
function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

/**
 * managers2 削除
 *
 * managers2 主キー:
 * children_id + facility_id + staff_id + day_of_week_id
 *
 * - day_of_week_id があれば 1レコード削除
 * - day_of_week_id がなければ children_id + facility_id + staff_id の全曜日削除
 */
async function delete_manager(
  children_id,
  facility_id,
  staff_id,
  day_of_week_id = null
) {
  try {
    console.log("📨 main: delete_manager SEND:", {
      children_id,
      facility_id,
      staff_id,
      day_of_week_id,
    });

    if (isEmpty(children_id) || isEmpty(facility_id) || isEmpty(staff_id)) {
      const errorPayload = {
        children_id,
        facility_id,
        staff_id,
        day_of_week_id,
      };

      console.error("❌ delete_manager: 必須キー不足", errorPayload);

      throw new Error(
        "delete_manager: children_id, facility_id, staff_id は必須です。"
      );
    }

    let pk;
    let values;

    if (!isEmpty(day_of_week_id)) {
      // 単一曜日削除
      pk = "children_id,facility_id,staff_id,day_of_week_id";
      values = `${children_id},${facility_id},${staff_id},${day_of_week_id}`;
    } else {
      // 指定児童 + 指定施設 + 指定スタッフの全曜日削除
      pk = "children_id,facility_id,staff_id";
      values = `${children_id},${facility_id},${staff_id}`;
    }

    console.log("📨 main: delete_manager REQUEST:", {
      table: "managers2",
      pk,
      values,
    });

    const result = await apiClient.delete("managers2", {
      params: {
        pk,
        values,
      },
    });

    console.log("🟢 main: delete_manager RESULT:", result);

    return result;
  } catch (error) {
    console.error("❌ delete_manager ERROR:", {
      message: error?.message,
      response: error?.response?.data,
      stack: error?.stack,
    });

    throw error;
  }
}

module.exports = {
  delete_manager,
};
