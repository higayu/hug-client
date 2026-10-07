import { executeFlowV2 } from "../core/executeFlowV2.js";
import { createSynchronizationRuntime } from "./synchronizationRuntime.js";

async function run(flowKey, outputKey, input, options = {}) {
  const runtime = options.runtime || createSynchronizationRuntime({
    webviewRef: options.webviewRef,
    onStaffProgress: options.onStaffProgress,
    onChildrenProgress: options.onChildrenProgress,
    onPersonalRecordDetailProgress: options.onPersonalRecordDetailProgress,
  });

  const result = await executeFlowV2(flowKey, input, {
    ...options,
    runtime,
  });

  return result?.context?.[outputKey] ?? null;
}

export function fetchStaffV2({ facilityId }, options = {}) {
  return run(
    "staff_fetch",
    "staffData",
    { facilityId: String(facilityId ?? "") },
    options,
  );
}

export function fetchChildrenV2({ facilityId, targetDate }, options = {}) {
  return run(
    "children_fetch",
    "childrenData",
    {
      facilityId: String(facilityId ?? ""),
      targetDate: String(targetDate ?? ""),
    },
    options,
  );
}

export function fetchPersonalRecordListV2({ facilityId, year, month }, options = {}) {
  return run(
    "personal_record_list_fetch",
    "personalRecordList",
    {
      facilityId: String(facilityId ?? ""),
      year: Number(year),
      month: Number(month),
    },
    options,
  );
}

export function fetchPersonalRecordDetailsV2({ records }, options = {}) {
  return run(
    "personal_record_detail_fetch",
    "personalRecordDetails",
    { records: Array.isArray(records) ? records : [] },
    options,
  );
}
