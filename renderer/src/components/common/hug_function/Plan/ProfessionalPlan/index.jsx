// renderer/src/components/common/ProfessionalPlan
import React from "react";
import { useAppState } from "@/AppStateContext";
import { useSelector } from "react-redux";
import { selectSpaceChildId } from "@/store/slices/chilledspaceSlice.js";
import { useDataBase } from "@/hooks/useDataBase";
import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
/**
 * hugview の Cookie 付きセッションで URL の HTML を取得する
 * （renderer 上の fetch では webview のログイン Cookie が付かないため）
 */
async function fetchHtmlInWebview(webview, url) {
  const script = `
    (async () => {
      const targetUrl = ${JSON.stringify(url)};
      const res = await fetch(targetUrl, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      return {
        ok: res.ok,
        status: res.status,
        text: await res.text(),
      };
    })()
  `;
  return webview.executeJavaScript(script);
}

export default function ProfessionalPlan({ spaceId }) {
  const { DATABASE_TYPE } = useAppState();
  const selectedChildId = useSelector(selectSpaceChildId(spaceId));
  const { loadDataBase } = useDataBase();

  const handleGetProfessionalPlan = async () => {
    const listUrl =
      `https://www.hug-ayumu.link/hug/wm/addition_plan_situation.php?mode=list&c_id=${selectedChildId}`;

    const htmlElementToMarkdown = (root) => {
      const lines = [];

      const normalizeText = (text) => {
        return text
          .replace(/\u00a0/g, " ")
          .replace(/[ \t]+/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      };

      const getCellText = (cell) => {
        return normalizeText(cell.innerText || cell.textContent || "");
      };

      // タイトル
      const title = root.querySelector("h3");

      if (title) {
        const titleText = normalizeText(title.innerText || title.textContent || "")
          .replace(/\s*公開\s*$/, "");

        if (titleText) {
          lines.push(`# ${titleText}`);
          lines.push("");
        }
      }

      // 右上の基本情報
      const info = root.querySelector(".pull-right p");

      if (info) {
        const infoLines = normalizeText(info.innerText || info.textContent || "")
          .split("\n")
          .map((v) => normalizeText(v))
          .filter(Boolean);

        if (infoLines.length) {
          lines.push("## 基本情報");
          lines.push("");

          for (const line of infoLines) {
            lines.push(`- ${line}`);
          }

          lines.push("");
        }
      }

      // 上部テーブル：受給者証番号、支援期間、回数など
      const firstTable = root.querySelector(".ebox-content table");

      if (firstTable) {
        const cells = [...firstTable.querySelectorAll("th, td")].map(getCellText);

        if (cells.length >= 2) {
          lines.push("## 計画情報");
          lines.push("");

          for (let i = 0; i < cells.length; i += 2) {
            const key = cells[i];
            const value = cells[i + 1];

            if (key && value !== undefined) {
              lines.push(`- ${key}: ${value}`);
            }
          }

          lines.push("");
        }
      }

      // アセスメント、方針、長期目標、短期目標
      const summaryRows = [...root.querySelectorAll(".ebox-content table tr")]
        .filter((row) => {
          const th = row.querySelector("th");
          const td = row.querySelector("td");
          return th && td;
        });

      for (const row of summaryRows) {
        const th = row.querySelector("th");
        const td = row.querySelector("td");

        const heading = getCellText(th);
        const body = getCellText(td);

        // 受給者証番号などの1行テーブルは除外
        if (["受給者証番号", "支援期間", "回数"].includes(heading)) {
          continue;
        }

        if (heading && body) {
          lines.push(`## ${heading}`);
          lines.push("");
          lines.push(body);
          lines.push("");
        }
      }

      // 支援内容テーブル
      const careTable = root.querySelector(".carePlanContent table");

      if (careTable) {
        const rows = [...careTable.querySelectorAll("tr")];

        const headerRow = rows.find(
          (row) => row.querySelectorAll("th").length >= 2
        );

        const headers = headerRow
          ? [...headerRow.querySelectorAll("th")].map(getCellText).filter(Boolean)
          : [];

        const bodyRows = rows.filter((row) => row.querySelector("td"));

        if (headers.length && bodyRows.length) {
          lines.push("## 支援内容");
          lines.push("");

          lines.push(`| ${headers.join(" | ")} |`);
          lines.push(`| ${headers.map(() => "---").join(" | ")} |`);

          for (const row of bodyRows) {
            const cells = [...row.querySelectorAll("th, td")]
              .map((cell) => {
                return getCellText(cell)
                  .replace(/\n/g, "<br>")
                  .replace(/\|/g, "｜");
              });

            lines.push(`| ${cells.join(" | ")} |`);
          }

          lines.push("");
        }
      }

      // 署名欄
      const signArea = root.querySelector(".individualSign");

      if (signArea) {
        const signText = normalizeText(
          signArea.innerText || signArea.textContent || ""
        );

        if (signText) {
          lines.push("## 同意・署名");
          lines.push("");
          lines.push(signText);
          lines.push("");
        }
      }

      return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    };

    try {
      const webview = await getHugWebviewForCache();
      if (!webview) {
        console.error("[HUG WM] webview が見つかりません");
        return "";
      }

      console.log("[HUG WM] 一覧HTML fetch開始 (webview):", listUrl);

      const listResult = await fetchHtmlInWebview(webview, listUrl);

      console.log("[HUG WM] 一覧 status:", listResult.status);
      console.log("[HUG WM] 一覧 ok:", listResult.ok);

      if (!listResult.ok) {
        throw new Error(`一覧HTML取得エラー: ${listResult.status}`);
      }

      const listHtml = listResult.text;
      const parser = new DOMParser();
      const listDoc = parser.parseFromString(listHtml, "text/html");

      const table = listDoc.querySelector("div.individualSituation table.table");

      if (!table) {
        console.warn("[HUG WM] テーブル未存在");
        return;
      }

      const openLabel = [...table.querySelectorAll("i")]
        .find((el) => el.textContent.trim() === "公開");

      if (!openLabel) {
        console.warn("[HUG WM] 公開ラベル未存在");
        return;
      }

      const link = openLabel.closest("a");

      if (!link) {
        console.warn("[HUG WM] 公開リンク未存在");
        return;
      }

      const href = link.getAttribute("href");

      const detailUrlObj = new URL(
        href,
        "https://www.hug-ayumu.link/hug/wm/"
      );

      const selectId = detailUrlObj.searchParams.get("id");

      if (!selectId) {
        console.warn("[HUG WM] id取得失敗");
        return;
      }

      console.log("[HUG WM] 取得したSELECT_ID:", selectId);

      const detailUrl =
        `https://www.hug-ayumu.link/hug/wm/addition_plan.php?mode=detail&id=${selectId}`;

      console.log("[HUG WM] 詳細HTML fetch開始 (webview):", detailUrl);

      const detailResult = await fetchHtmlInWebview(webview, detailUrl);

      console.log("[HUG WM] 詳細 status:", detailResult.status);
      console.log("[HUG WM] 詳細 ok:", detailResult.ok);

      if (!detailResult.ok) {
        throw new Error(`詳細HTML取得エラー: ${detailResult.status}`);
      }

      const detailHtml = detailResult.text;
      const detailDoc = parser.parseFromString(detailHtml, "text/html");

      const carebreak = detailDoc.querySelector("#carebreak");

      if (!carebreak) {
        console.warn("[HUG WM] #carebreak 未存在");
        return;
      }

      console.log("[HUG WM] #carebreak 要素:");
      console.log(carebreak);

      console.log("[HUG WM] #carebreak HTML:");
      console.log(carebreak.outerHTML);

      console.log("[HUG WM] #carebreak テキスト:");
      console.log(carebreak.textContent.trim());

      const markdown = htmlElementToMarkdown(carebreak);

      console.log("[HUG WM] #carebreak Markdown:");
      console.log(markdown);

      if (!markdown || !selectedChildId) {
        return markdown;
      }

      const childrenUpdate =
        DATABASE_TYPE === "laravel"
          ? window.electronAPI?.laravel_children_update
          : window.electronAPI?.mariadb_children_update;
      const childrenUpdateApiName =
        DATABASE_TYPE === "laravel"
          ? "laravel_children_update"
          : "mariadb_children_update";

      if (typeof childrenUpdate !== "function") {
        console.warn(`[HUG WM] ${childrenUpdateApiName} が利用できません`);
        return markdown;
      }

      const updateResult = await childrenUpdate({
        pk: "id",
        values: String(selectedChildId),
        data: { notes: markdown },
      });

      if (updateResult?.success === false) {
        throw new Error(updateResult.message || "児童情報の更新に失敗しました");
      }

      await loadDataBase({
        reason: "manual/ProfessionalPlan",
      });

      if (window.showInfoToast) {
        window.showInfoToast("専門支援計画を取得し、メモ（notes）を保存しました", 2500);
      }

      return markdown;
    } catch (error) {
      console.error("[HUG WM] エラー:", error);
      if (window.showInfoToast) {
        window.showInfoToast(`取得・保存エラー: ${error.message}`, 4000);
      }
      return "";
    }
  };

  return (
    <div>
      <button 
      className="w-40 h-10 bg-purple-500 hover:bg-purple-600 text-white rounded flex items-center justify-center gap-2 group"
      type="button" 
      onClick={handleGetProfessionalPlan}
      >
        計画を更新
        <ArrowPathIcon
          className="w-4 h-4 transition-transform group-hover:translate-x-1"
        />
      </button>
    </div>
  );
}
