// \renderer\src\hooks\useNote\noteUtils.js

const WEEKDAY_MAP = {
  日: 1,
  月: 2,
  火: 3,
  水: 4,
  木: 5,
  金: 6,
  土: 7,
};

function normalizeDatabaseType(value) {
  if (typeof value === "string") return value.toLowerCase();

  if (value && typeof value === "object") {
    return String(
      value.type || value.databaseType || value.dbType || "mariadb"
    ).toLowerCase();
  }

  return "sqlite";
}

async function getDatabaseType() {
  try {
    const result = await window.electronAPI.getDatabaseType();
    return normalizeDatabaseType(result);
  } catch (err) {
    console.warn("⚠️ databaseType取得失敗。SQLiteとして処理します:", err);
    return "sqlite";
  }
}

async function getTempNoteApiNames() {
  const databaseType = await getDatabaseType();

  if (databaseType === "laravel") {
    return {
      databaseType,
      save: "laravel_saveTempNote",
      save1: "laravel_saveTempNote1",
      save2: "laravel_saveTempNote2",
      get: "laravel_getTempNote",
    };
  }

  if (databaseType === "mariadb") {
    return {
      databaseType,
      save: "mariadb_saveTempNote",
      save1: "mariadb_saveTempNote1",
      save2: "mariadb_saveTempNote2",
      get: "mariadb_getTempNote",
    };
  }

  return {
    databaseType,
    save: "sqlite_saveTempNote",
    save1: "sqlite_saveTempNote1",
    save2: "sqlite_saveTempNote2",
    get: "sqlite_getTempNote",
  };
}

function getTempNoteErrorMessage(result, fallbackMessage) {
  const candidates = [
    result?.message,
    result?.error?.message,
    result?.error?.details?.message,
    result?.error?.details?.error,
    typeof result?.error === "string" ? result.error : null,
  ];

  return candidates.find(
    (message) => typeof message === "string" && message.trim()
  ) || fallbackMessage;
}

/**
 * 一時メモを保存する
 */
export async function saveTempNote(childId, memo1, memo2, appState) {
  console.group("📝 saveTempNote() 呼び出し");

  try {
    console.log("📌 childId:", childId);
    console.log("📌 memo1:", memo1);
    console.log("📌 memo2:", memo2);
    console.log("📌 appState:", appState);

    if (!childId || !appState?.STAFF_ID || !appState?.CURRENT_DAY_OF_WEEK) {
      throw new Error("必須パラメータ不足");
    }

    const dayOfWeekId = appState?.CURRENT_DAY_OF_WEEK?.weekdayId;

    if (dayOfWeekId == null) {
      throw new Error("day_of_week_id が取得できません");
    }

    const data = {
      children_id: childId,
      staff_id: appState.STAFF_ID,
      day_of_week_id: dayOfWeekId,
      memo1: memo1 ?? "",
      memo2: memo2 ?? "",
    };

    const apiNames = await getTempNoteApiNames();

    console.log("🗄️ 使用DB:", apiNames.databaseType);
    console.log("📤 送信データ(saveTempNote):", data);
    console.log("📡 使用API:", apiNames.save);

    const fn = window.electronAPI?.[apiNames.save];

    if (typeof fn !== "function") {
      throw new Error(`${apiNames.save} が window.electronAPI に存在しません`);
    }

    const result = await fn(data);

    console.log("📥 受信結果(saveTempNote):", result);

    if (result?.success || result?.affectedRows || result?.id || result?.changes) {
      console.log("✅ TEMP_NOTE 保存成功");
      return true;
    }

    throw new Error(getTempNoteErrorMessage(result, "保存失敗"));
  } catch (error) {
    console.error("❌ 一時メモ保存エラー(saveTempNote):", error);
    return false;
  } finally {
    console.groupEnd();
  }
}

/**
 * 一時メモを保存する1
 */
export async function saveTempNote1(childId, memo1, appState) {
  console.group("📝 saveTempNote1() 呼び出し");

  try {
    console.log("📌 childId:", childId);
    console.log("📌 memo1:", memo1);
    console.log("📌 appState:", appState);

    if (!childId || !appState?.STAFF_ID || !appState?.CURRENT_DAY_OF_WEEK) {
      throw new Error("必須パラメータ不足");
    }

    const dayOfWeekId = appState?.CURRENT_DAY_OF_WEEK?.weekdayId;

    if (dayOfWeekId == null) {
      throw new Error("day_of_week_id が取得できません");
    }

    const data = {
      children_id: childId,
      staff_id: appState.STAFF_ID,
      day_of_week_id: dayOfWeekId,
      memo1: memo1 ?? "",
    };

    const apiNames = await getTempNoteApiNames();

    console.log("🗄️ 使用DB:", apiNames.databaseType);
    console.log("📤 送信データ(saveTempNote1):", data);
    console.log("📡 使用API:", apiNames.save1);

    const fn = window.electronAPI?.[apiNames.save1];

    if (typeof fn !== "function") {
      throw new Error(`${apiNames.save1} が window.electronAPI に存在しません`);
    }

    const result = await fn(data);

    console.log("📥 受信結果(saveTempNote1):", result);

    if (result?.success || result?.affectedRows || result?.id || result?.changes) {
      console.log("✅ TEMP_NOTE 保存成功");
      return true;
    }

    throw new Error(getTempNoteErrorMessage(result, "保存失敗"));
  } catch (error) {
    console.error("❌ 一時メモ保存エラー(saveTempNote1):", error);
    return false;
  } finally {
    console.groupEnd();
  }
}

/**
 * 一時メモを保存する2
 */
export async function saveTempNote2(childId, memo2, appState) {
  console.group("📝 saveTempNote2() 呼び出し");

  try {
    console.log("📌 childId:", childId);
    console.log("📌 memo2:", memo2);
    console.log("📌 appState:", appState);

    if (!childId || !appState?.STAFF_ID || !appState?.CURRENT_DAY_OF_WEEK) {
      throw new Error("必須パラメータ不足");
    }

    const dayOfWeekId = appState?.CURRENT_DAY_OF_WEEK?.weekdayId;

    if (dayOfWeekId == null) {
      throw new Error("day_of_week_id が取得できません");
    }

    const data = {
      children_id: childId,
      staff_id: appState.STAFF_ID,
      day_of_week_id: dayOfWeekId,
      memo2: memo2 ?? "",
    };

    const apiNames = await getTempNoteApiNames();

    console.log("🗄️ 使用DB:", apiNames.databaseType);
    console.log("📤 送信データ(saveTempNote2):", data);
    console.log("📡 使用API:", apiNames.save2);

    const fn = window.electronAPI?.[apiNames.save2];

    if (typeof fn !== "function") {
      throw new Error(`${apiNames.save2} が window.electronAPI に存在しません`);
    }

    const result = await fn(data);

    console.log("📥 受信結果(saveTempNote2):", result);

    if (result?.success || result?.affectedRows || result?.id || result?.changes) {
      console.log("✅ TEMP_NOTE 保存成功");
      return true;
    }

    throw new Error(getTempNoteErrorMessage(result, "保存失敗"));
  } catch (error) {
    console.error("❌ 一時メモ保存エラー(saveTempNote2):", error);
    return false;
  } finally {
    console.groupEnd();
  }
}

/**
 * 一時メモを読み込む
 */
export async function loadTempNote(childId, proxy, appState, { throwOnError = false } = {}) {
  console.group("📄 loadTempNote() 呼び出し");

  try {
    console.log("📌 childId:", childId);
    console.log("📌 proxy:", proxy);
    console.log("📌 appState:", appState);

    if (!childId || !appState?.STAFF_ID || !appState?.CURRENT_DAY_OF_WEEK) {
      throw new Error("必須パラメータ不足");
    }

    const dayOfWeekId = appState?.CURRENT_DAY_OF_WEEK?.weekdayId;

    if (dayOfWeekId == null) {
      throw new Error("day_of_week_id が取得できません");
    }

    const data = {
      children_id: childId,
      staff_id: appState.STAFF_ID,
      day_of_week_id: dayOfWeekId,
    };

    const apiNames = await getTempNoteApiNames();

    console.log("🗄️ 使用DB:", apiNames.databaseType);
    console.log("📤 送信データ(getTempNote):", data);
    console.log("📡 使用API:", apiNames.get);

    const fn = window.electronAPI?.[apiNames.get];

    if (typeof fn !== "function") {
      throw new Error(`${apiNames.get} が window.electronAPI に存在しません`);
    }

    const result = await fn(data);

    console.log("📥 受信結果(getTempNote):", result);

    if (result?.success !== true) {
      throw new Error(getTempNoteErrorMessage(result, "一時メモの取得に失敗しました。"));
    }

    if (result?.success && result?.data) {
      proxy.value = {
        memo1: result.data.memo1 ?? "",
        memo2: result.data.memo2 ?? "",
      };
      console.log("✅ TEMP_NOTE 読込成功");
      return true;
    }

    proxy.value = { memo1: "", memo2: "" };
    console.log("ℹ️ TEMP_NOTE なし");
    return false;
  } catch (error) {
    console.error("❌ TEMP_NOTE 読込失敗:", error);
    if (throwOnError) throw error;
    proxy.value = { memo1: "", memo2: "" };
    return false;
  } finally {
    console.groupEnd();
  }
}
