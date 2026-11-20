
import React, { useCallback, useState } from "react";
import { useToast } from "@/utils/notifications.jsx";
import PromptPanel from "./PromptPanel";
import { AI_PROMPT_COMPONENT_MAP } from "./PromptBox";
import { sendPromptToLaravelApi } from "./send/sendPromptToLaravelApi";

// ==========================================
// エラー情報の取得
// ==========================================

function getErrorDetails(error) {
  const errorData = error?.error ?? {};

  const type = String(
    error?.type ??
    errorData?.type ??
    ""
  ).toLowerCase();

  const code = String(
    error?.code ??
    errorData?.code ??
    ""
  ).toUpperCase();

  const rawStatus =
    error?.status ??
    errorData?.status ??
    error?.response?.status ??
    null;

  const status =
    rawStatus === null || rawStatus === ""
      ? null
      : Number(rawStatus);

  const message = String(
    error?.message ??
    errorData?.message ??
    ""
  );

  return {
    type,
    code,
    status: Number.isFinite(status) ? status : null,
    message,
  };
}

// ==========================================
// エラー分類
// ==========================================

function classifyError(error) {
  const { type, code, status, message } = getErrorDetails(error);

  // ------------------------------------------
  // 1. タイムアウト
  // ------------------------------------------

  if (
    type === "timeout" ||
    code === "ECONNABORTED" ||
    code === "ETIMEDOUT" ||
    /timeout of \d+ms exceeded/i.test(message)
  ) {
    return {
      type: "timeout",
      message:
        "AIからの応答が制限時間内に返りませんでした。" +
        "Laravel側では処理が継続中、または完了している可能性があります。" +
        "再送信するとAI処理が重複する可能性があります。",
    };
  }

  // ------------------------------------------
  // 2. サーバー側タイムアウト
  // ------------------------------------------

  if (
    type === "server_timeout" ||
    status === 408 ||
    status === 504
  ) {
    return {
      type: "server_timeout",
      message:
        "Laravel APIまたは接続先サーバーでタイムアウトが発生しました。" +
        "処理が完了している可能性があるため、結果を確認してください。",
    };
  }

  // ------------------------------------------
  // 3. 認証エラー
  // ------------------------------------------

  if (
    type === "authentication" ||
    status === 401 ||
    status === 403
  ) {
    return {
      type: "authentication",
      message:
        "Laravel APIの認証またはアクセス権限に問題があります。" +
        "再ログインしてからお試しください。",
    };
  }

  // ------------------------------------------
  // 4. API利用制限
  // ------------------------------------------

  if (
    type === "rate_limit" ||
    status === 429
  ) {
    return {
      type: "rate_limit",
      message:
        "AI APIの利用制限に達した可能性があります。" +
        "しばらく時間をおいてからお試しください。",
    };
  }

  // ------------------------------------------
  // 5. ネットワークエラー
  // ------------------------------------------

  if (
    type === "network" ||
    [
      "ERR_NETWORK",
      "ECONNREFUSED",
      "ENOTFOUND",
      "EAI_AGAIN",
      "ECONNRESET",
    ].includes(code)
  ) {
    return {
      type: "network",
      message:
        "Laravelサーバーとの通信に失敗しました。" +
        "インターネット接続とサーバーの稼働状況を確認してください。",
    };
  }

  // ------------------------------------------
  // 6. Laravel APIエラー
  // ------------------------------------------

  if (
    type === "api_error" ||
    (status !== null && status >= 400)
  ) {
    return {
      type: "api_error",
      message:
        `Laravel APIでエラーが発生しました` +
        (status !== null ? `（HTTP ${status}）` : "") +
        "。AI文章校正の処理状況を確認してください。",
    };
  }

  // ------------------------------------------
  // 7. その他のエラー
  // ------------------------------------------

  return {
    type: "unknown",
    message: message || "AI文章校正中に予期しないエラーが発生しました。",
  };
}

// ==========================================
// メインコンポーネント
// ==========================================

export default function LaravelApiContent({
  spaceId,
  activePromptKey,
  onPromptChange,
  onPromptTabsChange,
}) {
  const {
    showSuccessToast,
    showErrorToast,
    showInfoToast,
  } = useToast();

  const [laravelApiResults, setLaravelApiResults] = useState({});

  // ==========================================
  // Laravel API送信
  // ==========================================

  const sendPrompt = useCallback(
    async ({
      textValue,
      prompt,
      message,
      childId,
      promptKey = "personal",
    }) => {
      // ------------------------------------------
      // 送信開始通知
      // ------------------------------------------

      showInfoToast("Laravel API に送信中…");

      try {
        // ------------------------------------------
        // API送信
        // ------------------------------------------

        const text = await sendPromptToLaravelApi({
          textValue,
          prompt,
          message,
          promptKey,
          childId,
        });

        // ------------------------------------------
        // 結果保存
        // ------------------------------------------

        setLaravelApiResults((prev) => ({
          ...prev,
          [promptKey]: text,
        }));

        // ------------------------------------------
        // クリップボードコピー
        // ------------------------------------------

        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
          }
        } catch (clipboardError) {
          console.warn(
            "[LaravelApiContent] clipboard write skipped:",
            clipboardError
          );
        }

        // ------------------------------------------
        // 正常終了通知
        // ------------------------------------------

        showSuccessToast("Laravel API の応答を取得しました");

        return true;
      } catch (error) {
        // ------------------------------------------
        // エラー分類
        // ------------------------------------------

        const classifiedError = classifyError(error);

        console.error(
          "[LaravelApiContent] send error:",
          {
            promptKey,
            errorType: classifiedError.type,
            message: error?.message,
            code: error?.code,
            status: error?.status,
            error,
          }
        );

        // ------------------------------------------
        // エラー通知
        // ------------------------------------------

        showErrorToast(classifiedError.message);

        // ------------------------------------------
        // 呼び出し元へエラーを返す
        // ------------------------------------------

        // 元のErrorに分類情報を追加する。
        // Error以外がthrowされた場合も対応する。
        const propagatedError =
          error instanceof Error
            ? error
            : new Error(classifiedError.message);

        propagatedError.type = classifiedError.type;

        if (propagatedError !== error) {
          propagatedError.originalError = error;
        }

        throw propagatedError;
      }
    },
    [showErrorToast, showInfoToast, showSuccessToast]
  );

  // ==========================================
  // Laravel API返却値表示
  // ==========================================

  const renderLaravelApiResultArea = useCallback(
    ({ promptKey, label }) => (
      <div className="flex flex-col gap-1">
        <label className="font-bold text-gray-700 block mb-1">
          {label || "Laravel API 返却値"}
        </label>

        <textarea
          className="w-full h-40 p-2 border bg-gray-50 text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Laravel API の返却値がここに入ります"
          value={laravelApiResults[promptKey] || ""}
          onChange={(e) =>
            setLaravelApiResults((prev) => ({
              ...prev,
              [promptKey]: e.target.value,
            }))
          }
        />
      </div>
    ),
    [laravelApiResults]
  );

  // ==========================================
  // 画面描画
  // ==========================================

  return (
    <div className="flex flex-col items-center justify-center w-full p-2 space-y-3">
      <PromptPanel
        spaceId={spaceId}
        componentMap={AI_PROMPT_COMPONENT_MAP}
        activeKey={activePromptKey}
        onActiveKeyChange={onPromptChange}
        onTabsChange={onPromptTabsChange}
        sendPrompt={sendPrompt}
        laravelApiResults={laravelApiResults}
        aiName="Laravel API"
        renderLaravelApiResultArea={renderLaravelApiResultArea}
      />
    </div>
  );
}
