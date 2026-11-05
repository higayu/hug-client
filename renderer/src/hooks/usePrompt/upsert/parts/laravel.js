
/**
 * LaravelでAIプロンプトを登録・更新する。
 */
export async function upsertAiPrompt({
  promptId = null,
  staffId,
  companyId = null,
  itemId,
  content,
  isActive,
  updatedBy,
}) {
  const api = window.electronAPI?.laravel_procedure_upsertAiPrompt;

  if (typeof api !== "function") {
    throw new Error(
      "保存機能を利用できません。アプリを再起動してから、もう一度お試しください。"
    );
  }

  const normalizedPromptId =
    promptId == null || promptId === "" ? null : Number(promptId);

  const normalizedStaffId = Number(staffId);
  const normalizedItemId = Number(itemId);
  const normalizedUpdatedBy = Number(updatedBy);
  const normalizedCompanyId = companyId == null || companyId === "" ? null : Number(companyId);

  if (companyId != null && (companyId === "" || !Number.isInteger(normalizedCompanyId) || normalizedCompanyId <= 0)) {
    throw new Error("会社情報が不正です。画面を開き直してから、もう一度お試しください。");
  }

  const validIsActiveValues = [true, false, 1, 0, "1", "0"];

  const normalizedIsActive =
    isActive === true || isActive === 1 || isActive === "1" ? 1 : 0;

  if (
    normalizedPromptId !== null &&
    (!Number.isInteger(normalizedPromptId) || normalizedPromptId <= 0)
  ) {
    console.error("[AIプロンプト保存] prompt_idが不正", {
      promptId,
    });

    throw new Error(
      "編集対象のプロンプトを確認できませんでした。画面を開き直してから、もう一度お試しください。"
    );
  }

  if (!Number.isInteger(normalizedStaffId) || normalizedStaffId <= 0) {
    console.error("[AIプロンプト保存] staff_idが不正", {
      staffId,
    });

    throw new Error(
      "職員情報を取得できませんでした。ログイン状態を確認してから、もう一度お試しください。"
    );
  }

  if (!Number.isInteger(normalizedItemId) || normalizedItemId <= 0) {
    console.error("[AIプロンプト保存] item_idが不正", {
      itemId,
    });

    throw new Error(
      "プロンプトの種類を確認できませんでした。画面を開き直してから、もう一度お試しください。"
    );
  }

  if (typeof content !== "string" || content.trim().length === 0) {
    console.error("[AIプロンプト保存] contentが不正", {
      contentType: typeof content,
      contentLength:
        typeof content === "string" ? content.length : null,
    });

    throw new Error(
      "プロンプトの内容が入力されていません。必ず全て、内容を入力してから保存してください。"
    );
  }

  if (!validIsActiveValues.includes(isActive)) {
    console.error("[AIプロンプト保存] is_activeが不正", {
      isActive,
    });

    throw new Error(
      "プロンプトの有効・無効の設定を確認できませんでした。画面を開き直してから、もう一度お試しください。"
    );
  }

  if (!Number.isInteger(normalizedUpdatedBy) || normalizedUpdatedBy <= 0) {
    console.error("[AIプロンプト保存] updated_byが不正", {
      updatedBy,
    });

    throw new Error(
      "更新する職員の情報を取得できませんでした。ログイン状態を確認してから、もう一度お試しください。"
    );
  }

  try {
    const result = await api({
      prompt_id: normalizedPromptId,
      staff_id: normalizedCompanyId === null ? normalizedStaffId : null,
      company_id: normalizedCompanyId,
      item_id: normalizedItemId,
      content,
      is_active: normalizedIsActive,
      updated_by: normalizedUpdatedBy,
    });

    if (result?.success === false) {
      console.error("[AIプロンプト保存] APIエラー", result);

      throw new Error(
        result.message ||
          "プロンプトを保存できませんでした。時間をおいて、もう一度お試しください。"
      );
    }

    return result?.data ?? result;
  } catch (error) {
    console.error("[AIプロンプト保存] 保存処理失敗", error);

    throw error;
  }
}
