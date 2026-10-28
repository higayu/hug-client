import { executeFlowV2 } from "@/components/WebAutomationV2";
import { upsertPersonSupportPlan } from "./database_upsert";

export async function fetchPersonSupportPlan({ facilityId, selectChild, loadDataBase }) {
  if (!selectChild || !facilityId) throw new Error("児童IDまたは施設IDが指定されていません");
  const result = await executeFlowV2("person_support_plan_fetch", { facilityId, childId: selectChild });
  if (!result?.markdown) throw new Error("個別支援計画の本文がありません");
  await upsertPersonSupportPlan({ selectChild, markdown: result.markdown, loadDataBase });
  return result.markdown;
}
