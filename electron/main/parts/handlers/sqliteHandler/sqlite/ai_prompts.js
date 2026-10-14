const { connect } = require("./base");

function normalizeGetParams(data = {}) {
  const staffId = Number(data.staff_id);
  const itemId = data.item_id == null || data.item_id === ""
    ? null
    : Number(data.item_id);

  if (!Number.isInteger(staffId) || staffId <= 0) {
    throw new Error("staff_idが不正です。");
  }

  if (itemId !== null && (!Number.isInteger(itemId) || itemId <= 0)) {
    throw new Error("item_idが不正です。");
  }

  return { staffId, itemId };
}

function normalizeUpsertParams(data = {}) {
  const promptId = data.prompt_id == null || data.prompt_id === ""
    ? null
    : Number(data.prompt_id);
  const staffId = Number(data.staff_id);
  const itemId = Number(data.item_id);
  const updatedBy = Number(data.updated_by);
  const validActiveValues = [true, false, 1, 0, "1", "0"];

  if (promptId !== null && (!Number.isInteger(promptId) || promptId <= 0)) {
    throw new Error("prompt_idが不正です。");
  }
  if (!Number.isInteger(staffId) || staffId <= 0) {
    throw new Error("staff_idが不正です。");
  }
  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error("item_idが不正です。");
  }
  if (typeof data.content !== "string" || data.content.length === 0) {
    throw new Error("contentが不正です。");
  }
  if (!validActiveValues.includes(data.is_active)) {
    throw new Error("is_activeが不正です。");
  }
  if (!Number.isInteger(updatedBy) || updatedBy <= 0) {
    throw new Error("updated_byが不正です。");
  }

  return {
    promptId,
    staffId,
    itemId,
    content: data.content,
    isActive:
      data.is_active === true || data.is_active === 1 || data.is_active === "1"
        ? 1
        : 0,
    updatedBy,
  };
}

function getActiveAiPrompt(data = {}) {
  const { staffId, itemId } = normalizeGetParams(data);

  return new Promise((resolve, reject) => {
    const db = connect();
    db.all(
      `SELECT prompt_id, staff_id, item_id, content, is_active, updated_by, updated_at
       FROM ai_prompts
       WHERE staff_id = ?
         AND is_active = 1
         AND (? IS NULL OR item_id = ?)
       ORDER BY item_id ASC;`,
      [staffId, itemId, itemId],
      (error, rows) => {
        db.close();
        if (error) return reject(error);
        resolve(rows);
      }
    );
  });
}

function upsertAiPrompt(data = {}) {
  const params = normalizeUpsertParams(data);

  return new Promise((resolve, reject) => {
    const db = connect();
    let settled = false;

    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      db.close((closeError) => {
        if (error) return reject(error);
        if (closeError) return reject(closeError);
        resolve(result);
      });
    };

    db.serialize(() => {
      db.run("BEGIN TRANSACTION;", (beginError) => {
        if (beginError) return finish(beginError);

        const rollback = (error) => {
          db.run("ROLLBACK;", () => finish(error));
        };

        const commit = (promptId) => {
          db.run("COMMIT;", (commitError) => {
            if (commitError) return rollback(commitError);
            finish(null, { prompt_id: promptId });
          });
        };

        if (params.promptId === null) {
          db.run(
            `INSERT INTO ai_prompts
              (staff_id, item_id, content, is_active, updated_by)
             VALUES (?, ?, ?, ?, ?);`,
            [
              params.staffId,
              params.itemId,
              params.content,
              params.isActive,
              params.updatedBy,
            ],
            function (insertError) {
              if (insertError) return rollback(insertError);
              commit(this.lastID);
            }
          );
          return;
        }

        db.run(
          `UPDATE ai_prompts
           SET staff_id = ?, item_id = ?, content = ?, is_active = ?, updated_by = ?
           WHERE prompt_id = ?;`,
          [
            params.staffId,
            params.itemId,
            params.content,
            params.isActive,
            params.updatedBy,
            params.promptId,
          ],
          (updateError) => {
            if (updateError) return rollback(updateError);
            commit(params.promptId);
          }
        );
      });
    });
  });
}

module.exports = {
  normalizeGetParams,
  normalizeUpsertParams,
  getActiveAiPrompt,
  upsertAiPrompt,
};
