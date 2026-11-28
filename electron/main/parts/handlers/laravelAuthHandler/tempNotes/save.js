// main/parts/handlers/laravelAuthHandler/tempNotes/save.js

const laravelApiClient = require(
  "../../../../../../src/laravelApiClient"
);

const {
  executeAuthenticatedOperation,
} = require("../auth/authenticated");

const {
  formatError,
  unwrapData,
} = require("../auth/utils");

const {
  normalizeTempNotePayload,
} = require("./utils");

/**
 * 保存モードに応じたエラーメッセージを返す。
 */
function getFallbackMessage(mode) {
  if (mode === "memo1") {
    return "一時メモ1の保存に失敗しました。";
  }

  if (mode === "memo2") {
    return "一時メモ2の保存に失敗しました。";
  }

  return "一時メモの保存に失敗しました。";
}

/**
 * 一時メモをLaravel APIへ保存する。
 */
async function saveTempNote(
  payload = {},
  mode = "all"
) {
  const normalizedPayload =
    normalizeTempNotePayload(
      payload,
      mode
    );

  void 0;

  const fallbackMessage =
    getFallbackMessage(mode);

  const result =
    await executeAuthenticatedOperation(
      () =>
        laravelApiClient.post(
          "/temp_notes",
          normalizedPayload
        ),
      fallbackMessage
    );

  void 0;

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message: "一時メモを保存しました。",
    data: unwrapData(result),
    meta: {
      authenticated: true,
      mode,
      reauthenticated:
        result?.meta?.reauthenticated ??
        false,
    },
    error: null,
  };
}

/**
 * 保存モードごとのIPCハンドラーを作成する。
 */
function createTempNoteSaveHandler(mode) {
  return async (
    _event,
    payload = {}
  ) => {
    try {
      void 0;

      const result =
        await saveTempNote(
          payload,
          mode
        );

      if (result.success) {
        void 0;
      } else {
        console.error(
          "❌ [Laravel TempNote] save failed:",
          result
        );
      }

      return result;
    } catch (error) {
      console.error(
        "❌ [Laravel TempNote] save error:",
        error
      );

      return formatError(
        error,
        getFallbackMessage(mode)
      );
    }
  };
}

module.exports = {
  saveTempNote,

  saveAllHandler:
    createTempNoteSaveHandler("all"),

  saveMemo1Handler:
    createTempNoteSaveHandler("memo1"),

  saveMemo2Handler:
    createTempNoteSaveHandler("memo2"),
};