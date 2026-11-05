
/**
 * LaravelでAIプロンプトを登録・更新する。
 *
 * 1〜4番:
 *   companyId がある場合は会社共有、ない場合は個人プロンプトとして保存する。
 *
 * 50・51・100・150番:
 *   会社共有プロンプトとして保存する。
 *   scope: "company" を送信する。
 *
 * 会社共有として保存する場合は、item_id にかかわらず
 * scope: "company" を明示する。
 *
 * staff_id / updated_by:
 *   Electronから送信せず、Laravelの認証情報から決定する。
 */

const COMPANY_ONLY_ITEM_IDS = new Set([50, 51, 100, 150]);

export async function upsertAiPrompt({
  promptId = null,
  staffId, // 互換性維持。Laravelには送信しない。
  companyId = null,
  itemId,
  content,
  isActive,
  updatedBy, // 互換性維持。Laravelには送信しない。
}) {
  const api =
    window.electronAPI?.laravel_procedure_upsertAiPrompt;

  if (typeof api !== "function") {
    throw new Error(
      "保存機能を利用できません。アプリを再起動してから、もう一度お試しください。"
    );
  }

  // -------------------------------
  // 入力値の正規化
  // -------------------------------

  const normalizedPromptId =
    promptId == null || promptId === ""
      ? null
      : Number(promptId);

  const normalizedItemId = Number(itemId);

  const normalizedCompanyId =
    companyId == null || companyId === ""
      ? null
      : Number(companyId);

  const isCompanyOnlyItem =
    COMPANY_ONLY_ITEM_IDS.has(normalizedItemId);

  const validIsActiveValues = [
    true,
    false,
    1,
    0,
    "1",
    "0",
  ];

  const normalizedIsActive =
    isActive === true ||
    isActive === 1 ||
    isActive === "1"
      ? 1
      : 0;

  // -------------------------------
  // prompt_id の検証
  // -------------------------------

  if (
    normalizedPromptId !== null &&
    (
      !Number.isInteger(normalizedPromptId) ||
      normalizedPromptId <= 0
    )
  ) {
    console.error(
      "[AIプロンプト保存] prompt_idが不正",
      { promptId }
    );

    throw new Error(
      "編集対象のプロンプトを確認できませんでした。画面を開き直してから、もう一度お試しください。"
    );
  }

  // -------------------------------
  // item_id の検証
  // -------------------------------

  if (
    !Number.isInteger(normalizedItemId) ||
    normalizedItemId <= 0
  ) {
    console.error(
      "[AIプロンプト保存] item_idが不正",
      { itemId }
    );

    throw new Error(
      "プロンプトの種類を確認できませんでした。画面を開き直してから、もう一度お試しください。"
    );
  }

  // -------------------------------
  // company_id の検証
  // -------------------------------

  if (
    companyId != null &&
    (
      companyId === "" ||
      !Number.isInteger(normalizedCompanyId) ||
      normalizedCompanyId <= 0
    )
  ) {
    console.error(
      "[AIプロンプト保存] company_idが不正",
      { companyId }
    );

    throw new Error(
      "会社情報が不正です。画面を開き直してから、もう一度お試しください。"
    );
  }

  // 会社共有専用プロンプトには会社IDが必要
  if (
    isCompanyOnlyItem &&
    normalizedCompanyId === null
  ) {
    console.error(
      "[AIプロンプト保存] 会社共有プロンプトの会社IDがありません",
      {
        itemId: normalizedItemId,
        companyId,
      }
    );

    throw new Error(
      "会社共有プロンプトの保存先会社を確認できませんでした。会社情報を取得し直してください。"
    );
  }

  // -------------------------------
  // content の検証
  // -------------------------------

  if (
    typeof content !== "string" ||
    content.trim().length === 0
  ) {
    console.error(
      "[AIプロンプト保存] contentが不正",
      {
        contentType: typeof content,
        contentLength:
          typeof content === "string"
            ? content.length
            : null,
      }
    );

    throw new Error(
      "プロンプトの内容が入力されていません。必ず全て、内容を入力してから保存してください。"
    );
  }

  // -------------------------------
  // is_active の検証
  // -------------------------------

  if (!validIsActiveValues.includes(isActive)) {
    console.error(
      "[AIプロンプト保存] is_activeが不正",
      { isActive }
    );

    throw new Error(
      "プロンプトの有効・無効の設定を確認できませんでした。画面を開き直してから、もう一度お試しください。"
    );
  }

  // -------------------------------
  // Laravel APIへ送信
  // -------------------------------

  const payload = {
    prompt_id: normalizedPromptId,
    company_id: normalizedCompanyId,
    item_id: normalizedItemId,
    content,
    is_active: normalizedIsActive,

    // 会社専用項目、または会社IDが指定された共有プロンプト
    ...(isCompanyOnlyItem || normalizedCompanyId !== null
      ? { scope: "company" }
      : {}),
  };

  try {
    const result = await api(payload);

    if (result?.success === false) {
      console.error(
        "[AIプロンプト保存] APIエラー",
        result
      );

      throw new Error(
        result.message ||
        "プロンプトを保存できませんでした。時間をおいて、もう一度お試しください。"
      );
    }

    return result?.data ?? result;
  } catch (error) {
    console.error(
      "[AIプロンプト保存] 保存処理失敗",
      error
    );

    throw error;
  }
}
