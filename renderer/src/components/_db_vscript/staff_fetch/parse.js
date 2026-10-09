function cleanText(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumberOrNull(value) {
  const text =
    cleanText(value);

  if (!text) {
    return null;
  }

  const number =
    Number(text);

  return Number.isNaN(number)
    ? null
    : number;
}

function normalizeNullableDate(value) {
  const text =
    cleanText(value)
      .replace(/\//g, "-");

  if (
    !text ||
    text === "0000-00-00"
  ) {
    return null;
  }

  return text;
}

function parseLastUpdated(value) {
  const text =
    cleanText(value);

  const match =
    text.match(
      /^(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+)$/
    );

  return {
    last_updated_at:
      match
        ? match[1].replace(
            /\//g,
            "-"
          )
        : text,

    last_updated_by:
      match
        ? match[2]
        : "",
  };
}

function parseBelongings(value) {
  const text =
    cleanText(value);

  if (!text) {
    return [];
  }

  return text
    .split(/、(?=[^、：]+：)/)
    .map(cleanText)
    .filter(Boolean)
    .map((part) => {
      const separatorIndex =
        part.indexOf("：");

      if (
        separatorIndex === -1
      ) {
        return {
          facility: "",
          job: part,
          experience: "",
          notes: [],
          raw: part,
        };
      }

      const facility =
        cleanText(
          part.slice(
            0,
            separatorIndex
          )
        );

      let jobText =
        cleanText(
          part.slice(
            separatorIndex + 1
          )
        );

      const experienceMatch =
        jobText.match(
          /[（(]児童福祉事業実務経験：([^）)]+)[）)]/
        );

      const experience =
        experienceMatch
          ? cleanText(
              experienceMatch[1]
            )
          : "";

      if (experienceMatch) {
        jobText =
          cleanText(
            jobText.replace(
              experienceMatch[0],
              ""
            )
          );
      }

      const [
        job = "",
        ...notes
      ] = jobText
        .split("・")
        .map(cleanText)
        .filter(Boolean);

      return {
        facility,
        job,
        experience,
        notes,
        raw: part,
      };
    });
}

function parseStaffId(
  row,
  config
) {
  const selector =
    config?.staffId?.selector ||
    "button[onclick]";

  const attribute =
    config?.staffId?.attribute ||
    "onclick";

  const patternText =
    config?.staffId?.pattern ||
    "[?&]id=(\\d+)";

  const value =
    row
      .querySelector(selector)
      ?.getAttribute(attribute) ?? "";

  const pattern =
    new RegExp(
      String(patternText)
        .replace(
          /\\\\d/g,
          "\\d"
        )
    );

  const match =
    value.match(pattern);

  return match
    ? Number(match[1])
    : null;
}

function findStaffContainer(
  doc,
  config
) {
  const loginDetection =
    config?.loginDetection || {};

  const passwordSelector =
    loginDetection.passwordSelector ||
    'input[type="password"]';

  const titleContains =
    loginDetection.titleContains ||
    "ログイン";

  const isLoginPage =
    !!doc.querySelector(
      passwordSelector
    ) ||
    String(
      doc.title || ""
    ).includes(
      titleContains
    );

  if (isLoginPage) {
    throw new Error(
      "HUGのログインが切れています。ログイン後に再実行してください。"
    );
  }

  const selector =
    config?.containerSelector ||
    "body > div.contents > div.ibox";

  const tableSelector =
    config?.tableSelector ||
    "table.table";

  const iboxes =
    Array.from(
      doc.querySelectorAll(
        selector
      )
    );

  const staffIbox =
    iboxes.find((ibox) => {
      const headings =
        Array.from(
          ibox.querySelectorAll(
            `${tableSelector} thead th`
          )
        ).map(
          (th) =>
            cleanText(
              th.textContent
            )
        );

      return (
        headings.includes("指導員名") &&
        headings.includes("勤務形態") &&
        headings.includes("所属施設・職種") &&
        headings.includes("表示順") &&
        headings.includes("入社日") &&
        headings.includes("退職日") &&
        headings.includes("最終更新")
      );
    }) ??
    doc.querySelector(selector);

  if (!staffIbox) {
    throw new Error(
      "職員一覧を取得できませんでした。HUGの画面状態を確認してください。"
    );
  }

  return staffIbox;
}

function parseStaffRows(
  container,
  config
) {
  const rowSelector =
    config?.rowSelector ||
    "tbody tr";

  const tableSelector =
    config?.tableSelector ||
    "table.table";

  const columns =
    config?.columns || {};

  const nameIndex =
    Number(columns.name ?? 1);

  const workStyleIndex =
    Number(columns.workStyle ?? 2);

  const belongingsIndex =
    Number(columns.belongings ?? 3);

  const displayOrderIndex =
    Number(columns.displayOrder ?? 4);

  const enterDateIndex =
    Number(columns.enterDate ?? 5);

  const terminationDateIndex =
    Number(columns.terminationDate ?? 6);

  const lastUpdatedIndex =
    Number(columns.lastUpdated ?? 7);

  const rows =
    Array.from(
      container.querySelectorAll(
        `${tableSelector} ${rowSelector}`
      )
    );

  return rows
    .map((row) => {
      const cells =
        Array.from(
          row.querySelectorAll("td")
        );

      const maxIndex =
        Math.max(
          nameIndex,
          workStyleIndex,
          belongingsIndex,
          displayOrderIndex,
          enterDateIndex,
          terminationDateIndex,
          lastUpdatedIndex
        );

      if (
        cells.length <=
        maxIndex
      ) {
        return null;
      }

      const belongingText =
        cleanText(
          cells[
            belongingsIndex
          ]?.textContent
        );

      return {
        id:
          parseStaffId(
            row,
            config
          ),

        name:
          cleanText(
            cells[
              nameIndex
            ]?.textContent
          ),

        work_style:
          cleanText(
            cells[
              workStyleIndex
            ]?.textContent
          ),

        belongings:
          parseBelongings(
            belongingText
          ),

        belonging_text:
          belongingText,

        display_order:
          toNumberOrNull(
            cells[
              displayOrderIndex
            ]?.textContent
          ),

        enter_date:
          normalizeNullableDate(
            cells[
              enterDateIndex
            ]?.textContent
          ),

        termination_date:
          normalizeNullableDate(
            cells[
              terminationDateIndex
            ]?.textContent
          ),

        ...parseLastUpdated(
          cells[
            lastUpdatedIndex
          ]?.textContent
        ),
      };
    })
    .filter(
      (staff) =>
        staff &&
        (
          staff.id !== null ||
          staff.name
        )
    );
}

function parseTotalCount(
  container,
  config
) {
  const selector =
    config?.total?.selector ||
    ".ibox-title h5";

  const patternText =
    config?.total?.pattern ||
    "全部で(\\d+)件";

  const pattern =
    new RegExp(
      String(patternText)
        .replace(
          /\\\\d/g,
          "\\d"
        )
    );

  const titles =
    Array.from(
      container.querySelectorAll(
        selector
      )
    );

  for (const title of titles) {
    const text =
      cleanText(
        title.textContent
      );

    const match =
      text.match(pattern);

    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

function parseVisibleMaxPage(
  container,
  config
) {
  const selector =
    config?.pagination?.selector ||
    ".pagination a[href]";

  const parameter =
    config?.pagination?.parameter ||
    "page";

  const escapedParameter =
    String(parameter).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

  const pattern =
    new RegExp(
      `[?&]${escapedParameter}=(\\d+)`
    );

  const pages =
    Array.from(
      container.querySelectorAll(
        selector
      )
    )
      .map((link) => {
        const href =
          link.getAttribute("href") ?? "";

        const match =
          href.match(pattern);

        return match
          ? Number(match[1])
          : null;
      })
      .filter(
        (page) =>
          Number.isInteger(page) &&
          page > 0
      );

  return pages.length
    ? Math.max(...pages)
    : 1;
}

exports.parseStaffPage =
  function parseStaffPage(
    html,
    {
      page,
      url,
      config,
    }
  ) {
    const doc =
      new DOMParser()
        .parseFromString(
          html,
          "text/html"
        );

    const container =
      findStaffContainer(
        doc,
        config
      );

    return {
      page,
      url,
      rows:
        parseStaffRows(
          container,
          config
        ),
      totalCount:
        parseTotalCount(
          container,
          config
        ),
      visibleMaxPage:
        parseVisibleMaxPage(
          container,
          config
        ),
    };
  };

exports.uniqueById =
  function uniqueById(
    staffList
  ) {
    const map =
      new Map();

    for (const staff of staffList) {
      const key =
        staff.id !== null &&
        staff.id !== undefined
          ? `id:${staff.id}`
          : [
              "fallback",
              staff.name,
              staff.display_order,
              staff.enter_date,
              staff.termination_date,
            ].join("|");

      if (!map.has(key)) {
        map.set(
          key,
          staff
        );
      }
    }

    return Array.from(
      map.values()
    );
  };
