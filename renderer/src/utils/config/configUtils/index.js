// renderer/src/utils/config/configUtils/index.js
// 設定ファイル（config.json）の読み書きユーティリティ

import { MESSAGES, ELEMENT_IDS } from "@/utils/app/constants";
import { getDateString, getTodayWeekdayId } from "@/utils/date/dateUtils";

/**
 * config.jsonを保存
 * @param {Object} configData - 保存する設定データ
 * @returns {Promise<boolean>} 保存に成功した場合true
 */
export async function saveConfig(configData) {
  try {
    const result = await window.electronAPI.saveConfig(configData);

    if (!result.success) {
      console.error("❌ config.json保存エラー:", result.error);
      return false;
    }

    void 0;
    return true;
  } catch (err) {
    console.error(MESSAGES.ERROR.CONFIG_SAVE, err);
    return false;
  }
}

/**
 * config.jsonを読み込み
 * @returns {Promise<Object|null>} 読み込んだ設定データ、失敗時はnull
 */
export async function loadConfig() {
  const output = document.getElementById(ELEMENT_IDS.CONFIG_OUTPUT);

  try {
    void 0;

    const result = await window.electronAPI.readConfig();

    void 0;

    if (!result.success) {
      console.error("❌ [CONFIG] 読み込みエラー:", result.error);

      if (output) {
        output.textContent = "❌ 読み込みエラー: " + result.error;
      }

      return null;
    }

    const data = result.data ?? {};

    void 0;

    // =============================================================
    // CURRENT_DAY_OF_WEEK を自動セット
    // =============================================================
    const dateStr = getDateString();
    const weekdayId = getTodayWeekdayId();

    data.CURRENT_DAY_OF_WEEK = {
      dateStr,
      weekdayId,
    };

    // 旧キーがあれば削除
    // CURRENT_DAY_OF_WEEK は新仕様なので削除しない
    delete data.DATE_STR;

    void 0;

    if (output) {
      output.textContent = JSON.stringify(data, null, 2);
    }

    return data;
  } catch (err) {
    console.error("❌ [CONFIG] config.json読み込みエラー:", err);

    if (output) {
      output.textContent = "❌ エラー: " + err.message;
    }

    return null;
  }
}