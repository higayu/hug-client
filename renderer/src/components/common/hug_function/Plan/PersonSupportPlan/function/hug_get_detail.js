function htmlElementToMarkdown(root) {
  const lines = [];
  const normalizeText = (text) => text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const getCellText = (cell) => normalizeText(cell.innerText || cell.textContent || "");

  const title = root.querySelector("h3");
  if (title) {
    const text = getCellText(title).replace(/\s*公開\s*$/, "");
    if (text) lines.push(`# ${text}`, "");
  }

  const info = root.querySelector(".pull-right p");
  if (info) {
    const infoLines = getCellText(info).split("\n").map(normalizeText).filter(Boolean);
    if (infoLines.length) {
      lines.push("## 基本情報", "", ...infoLines.map((line) => `- ${line}`), "");
    }
  }

  const firstTable = root.querySelector(".ebox-content table");
  if (firstTable) {
    const cells = [...firstTable.querySelectorAll("th, td")].map(getCellText);
    if (cells.length >= 2) {
      lines.push("## 計画情報", "");
      for (let index = 0; index < cells.length; index += 2) {
        if (cells[index] && cells[index + 1] !== undefined) {
          lines.push(`- ${cells[index]}: ${cells[index + 1]}`);
        }
      }
      lines.push("");
    }
  }

  const summaryRows = [...root.querySelectorAll(".ebox-content table tr")]
    .filter((row) => row.querySelector("th") && row.querySelector("td"));
  for (const row of summaryRows) {
    const heading = getCellText(row.querySelector("th"));
    const body = getCellText(row.querySelector("td"));
    if (!["受給者証番号", "支援期間", "回数"].includes(heading) && heading && body) {
      lines.push(`## ${heading}`, "", body, "");
    }
  }

  const careTable = root.querySelector(".carePlanContent table");
  if (careTable) {
    const rows = [...careTable.querySelectorAll("tr")];
    const headerRow = rows.find((row) => row.querySelectorAll("th").length >= 2);
    const headers = headerRow
      ? [...headerRow.querySelectorAll("th")].map(getCellText).filter(Boolean)
      : [];
    const bodyRows = rows.filter((row) => row.querySelector("td"));
    if (headers.length && bodyRows.length) {
      lines.push("## 支援内容", "", `| ${headers.join(" | ")} |`);
      lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
      for (const row of bodyRows) {
        const cells = [...row.querySelectorAll("th, td")].map((cell) =>
          getCellText(cell).replace(/\n/g, "<br>").replace(/\|/g, "｜")
        );
        lines.push(`| ${cells.join(" | ")} |`);
      }
      lines.push("");
    }
  }

  const signArea = root.querySelector(".individualSign");
  if (signArea) {
    const text = getCellText(signArea);
    if (text) lines.push("## 同意・署名", "", text, "");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function fetchPersonSupportPlanDetailHtml(webview, id) {
  if (!id) throw new Error("個別支援計画書のIDが指定されていません");

  const detailUrl = `https://www.hug-ayumu.link/hug/wm/individual_care-plan-main.php?mode=detail&id=${encodeURIComponent(id)}`;
  const script = `
    (async () => {
      const res = await fetch(${JSON.stringify(detailUrl)}, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      return { ok: res.ok, status: res.status, text: await res.text() };
    })()
  `;
  const result = await webview.executeJavaScript(script);
  if (!result.ok) throw new Error(`詳細HTML取得エラー: ${result.status}`);

  const document = new DOMParser().parseFromString(result.text, "text/html");
  const carePlan = document.querySelector("#carebreak");
  if (!carePlan) throw new Error("個別支援計画の詳細が見つかりません");

  return htmlElementToMarkdown(carePlan);
}
