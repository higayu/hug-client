import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import { upsertPersonSupportPlan } from "./database_upsert";
import { fetchPersonSupportPlanDetailHtml } from "./hug_get_detail";
import { fetchFirstPersonSupportPlanId } from "./hug_post_list";

export async function fetchPersonSupportPlan({ facilityId, selectChild, loadDataBase }) {
  const webview = await getHugWebviewForCache();
  if (!webview) throw new Error("Webviewが利用できません");

  const id = await fetchFirstPersonSupportPlanId({ webview, facilityId, selectChild });
  const markdown = await fetchPersonSupportPlanDetailHtml(webview, id);
  await upsertPersonSupportPlan({ selectChild, markdown, loadDataBase });
  return markdown;
}
