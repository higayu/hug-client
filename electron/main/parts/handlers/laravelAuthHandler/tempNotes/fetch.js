// main/parts/handlers/laravelAuthHandler/tempNotes/fetch.js

const laravelApiClient = require(
  "../../../../../../src/laravelApiClient"
);

const {
  executeAuthenticatedOperation,
} = require("../auth/authenticated");

const {
  formatError,
} = require("../auth/utils");

const {
  buildTempNoteSearch,
  extractFirstTempNote,
} = require("./utils");

/**
 * 一時メモを複合主キーで取得する。
 */
async function fetchTempNote(payload = {}) {
  const {
    key,
    params,
  } = buildTempNoteSearch(payload);

  console.log(
    "📥 [Laravel TempNote] get request:",
    {
      key,
      path: "/temp_notes/_search",
      params,
    }
  );

  const result =
    await executeAuthenticatedOperation(
      () =>
        laravelApiClient.get(
          "/temp_notes/_search",
          {
            params,
          }
        ),
      "一時メモの取得に失敗しました。"
    );

  if (result?.success === false) {
    return result;
  }

  const tempNote =
    extractFirstTempNote(result);

  return {
    success: true,
    connected: true,
    message: tempNote
      ? "一時メモを取得しました。"
      : "一時メモは登録されていません。",
    data: tempNote,
    meta: {
      authenticated: true,
      found: Boolean(tempNote),
      reauthenticated:
        result?.meta?.reauthenticated ??
        false,
    },
    error: null,
  };
}

/**
 * 一時メモ取得用IPCハンドラー。
 */
const handler = async (
  _event,
  payload = {}
) => {
  try {
    console.log(
      "📝 [Laravel TempNote] IPC get:",
      payload
    );

    const result =
      await fetchTempNote(payload);

    if (result.success) {
      console.log(
        "✅ [Laravel TempNote] get DONE:",
        {
          found:
            result.meta?.found ??
            Boolean(result.data),
          data: result.data,
          reauthenticated:
            result.meta?.reauthenticated ??
            false,
        }
      );
    } else {
      console.error(
        "❌ [Laravel TempNote] get failed:",
        result
      );
    }

    return result;
  } catch (error) {
    console.error(
      "❌ [Laravel TempNote] get error:",
      error
    );

    return formatError(
      error,
      "一時メモの取得に失敗しました。"
    );
  }
};

module.exports = {
  fetchTempNote,
  handler,
};