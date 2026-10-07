import { fetchStaffData } from "@/components/common/Synchronization/StaffUpdateButton/fetchStaffData.js";
import { fetchChildrenData } from "@/components/common/Synchronization/ChildrenUpdateButton/fetchChildrenData.js";
import { buildPersonalRecordFetchScript } from "@/components/common/Synchronization/AllSyncButton/personalRecord.js";
import { fetchPersonalRecordDetails } from "@/components/common/Synchronization/AllSyncButton/fetchPersonalRecordDetails.js";

function getPassedWebview(webviewRef) {
  if (typeof webviewRef === "function") return webviewRef();
  if (webviewRef?.current) return webviewRef.current;
  return webviewRef || null;
}

async function fetchStaff({ config, context, runtime }) {
  const webview = await runtime.resolveWebview(config.webviewKey);
  return fetchStaffData(
    runtime.onStaffProgress,
    context.facilityId,
    webview,
    { config },
  );
}

async function fetchChildren({ config, context, runtime }) {
  const webview = await runtime.resolveWebview(config.webviewKey);
  return fetchChildrenData(
    runtime.onChildrenProgress,
    context.facilityId,
    context.targetDate,
    webview,
    { config },
  );
}

async function fetchPersonalRecordList({ config, context, runtime }) {
  const webview = await runtime.resolveWebview(config.webviewKey);
  const script = buildPersonalRecordFetchScript({
    facilityId: context.facilityId,
    year: context.year,
    month: context.month,
    config,
  });

  const result = await webview.executeJavaScript(script, true);
  if (result?.ok === false) {
    throw new Error(result.error || "個人記録一覧の取得に失敗しました。");
  }
  return result;
}

async function fetchPersonalRecordDetail({ config, context, runtime }) {
  const webview = await runtime.resolveWebview(config.webviewKey);
  const records = Array.isArray(context.records) ? context.records : [];
  const result = await fetchPersonalRecordDetails(webview, records, {
    config,
    onProgress: runtime.onPersonalRecordDetailProgress,
  });

  if (result?.ok === false) {
    throw new Error(result.error || "個人記録詳細の取得に失敗しました。");
  }
  return result;
}

export function createSynchronizationRuntime({
  webviewRef = null,
  onStaffProgress = null,
  onChildrenProgress = null,
  onPersonalRecordDetailProgress = null,
} = {}) {
  return {
    appKey: "hug-banso-navi",
    engineVersion: 1,
    onStaffProgress,
    onChildrenProgress,
    onPersonalRecordDetailProgress,

    resolveWebview: async () => {
      const webview = getPassedWebview(webviewRef);
      if (!webview || typeof webview.executeJavaScript !== "function") {
        throw new Error("HUG WebViewを取得できませんでした。");
      }
      return webview;
    },

    extractors: {
      "sync-staff-fetch": fetchStaff,
      "sync-children-fetch": fetchChildren,
      "personal-record-list-fetch": fetchPersonalRecordList,
      "personal-record-detail-fetch": fetchPersonalRecordDetail,
    },
  };
}
