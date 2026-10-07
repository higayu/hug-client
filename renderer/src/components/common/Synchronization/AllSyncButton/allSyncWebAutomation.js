export const ALL_SYNC_V2_FLOW_KEYS = [
  "staff_fetch",
  "children_fetch",
  "personal_record_list_fetch",
  "personal_record_detail_fetch",
];

/**
 * V1の Rule 集約取得は廃止。
 * V2では各処理が executeFlowV2(flowKey, input) から
 * published Flow + active Steps を直接取得する。
 */
export async function loadAllSyncAutomation() {
  const api = window.electronAPI?.laravel_webAutomationV2Flows_getAll;
  if (typeof api !== "function") {
    throw new Error("laravel_webAutomationV2Flows_getAll が preload に公開されていません。");
  }

  const response = await api({ app_key: "hug-banso-navi", engine_version: 1 });
  const rows = response?.data?.data ?? response?.data ?? [];
  const flows = Array.isArray(rows) ? rows : [];
  const found = new Set(flows.map((flow) => String(flow?.flow_key || "")));
  const missing = ALL_SYNC_V2_FLOW_KEYS.filter((key) => !found.has(key));
  if (missing.length) {
    throw new Error(`V2 Flowが不足しています: ${missing.join(", ")}`);
  }
  return { success: true, flowKeys: ALL_SYNC_V2_FLOW_KEYS, flows };
}
