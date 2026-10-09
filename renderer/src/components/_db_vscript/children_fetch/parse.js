function cleanText(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeChild(item) {
  const id = Number(
    item?.child_id ??
    item?.id ??
    item?.c_id ??
    item?.value
  );

  const name = cleanText(
    item?.name ??
    item?.child_name ??
    item?.text ??
    ""
  );

  const furigana = cleanText(
    item?.furigana ??
    item?.["ふりがな"] ??
    item?.kana ??
    ""
  );

  return {
    id,
    name,
    furigana,
  };
}

function parseOptions(doc) {
  return Array.from(
    doc.querySelectorAll("option")
  ).map((option) => ({
    id:
      Number(option.value),
    name:
      cleanText(
        option.textContent
      ),
    furigana:
      cleanText(
        option.dataset.furigana ||
        option.dataset.kana ||
        ""
      ),
  }));
}

function validChildren(children) {
  return children.filter(
    (child) =>
      Number.isFinite(child.id) &&
      child.id > 0 &&
      !!child.name
  );
}

exports.parseChildrenResponse =
  function parseChildrenResponse(
    text,
    config
  ) {
    const trimmed =
      String(text ?? "").trim();

    if (!trimmed) {
      return [];
    }

    const loginDetection =
      config?.loginDetection || {};

    const htmlContains =
      Array.isArray(
        loginDetection.htmlContains
      )
        ? loginDetection.htmlContains
        : [
            'type="password"',
            "ログイン",
          ];

    if (
      htmlContains.some(
        (value) =>
          value &&
          trimmed.includes(value)
      )
    ) {
      throw new Error(
        "HUGのログインが切れています。ログイン後に再実行してください。"
      );
    }

    if (
      trimmed.startsWith("[") ||
      trimmed.startsWith("{")
    ) {
      try {
        const data =
          JSON.parse(trimmed);

        if (
          data?.error ||
          data?.status === "error"
        ) {
          throw new Error(
            data?.error ||
            data?.message ||
            "HUG児童一覧APIでエラーが返されました"
          );
        }

        const response =
          config?.response || {};

        const possibleChildKeys =
          response.possibleChildKeys ||
          [
            "children",
            "child_list",
            "list",
          ];

        let childrenList =
          Array.isArray(data)
            ? data
            : null;

        if (!childrenList) {
          for (
            const key of possibleChildKeys
          ) {
            if (
              Array.isArray(data?.[key])
            ) {
              childrenList =
                data[key];
              break;
            }
          }
        }

        if (
          Array.isArray(childrenList)
        ) {
          return validChildren(
            childrenList.map(
              normalizeChild
            )
          );
        }
      } catch (error) {
        if (
          error?.message?.includes(
            "HUG児童一覧API"
          )
        ) {
          throw error;
        }

        // JSONとして解釈できない場合は
        // HTML / option形式として続行する。
      }
    }

    const doc =
      new DOMParser()
        .parseFromString(
          trimmed,
          "text/html"
        );

    let children =
      validChildren(
        parseOptions(doc)
      );

    if (children.length > 0) {
      return children;
    }

    const wrappedDoc =
      new DOMParser()
        .parseFromString(
          `<select>${trimmed}</select>`,
          "text/html"
        );

    return validChildren(
      parseOptions(wrappedDoc)
    );
  };

const SMALL_KANA_MAP = {
  "ぁ": "あ",
  "ぃ": "い",
  "ぅ": "う",
  "ぇ": "え",
  "ぉ": "お",
  "ゃ": "や",
  "ゅ": "ゆ",
  "ょ": "よ",
  "っ": "つ",
  "ゎ": "わ",
};

function toHiragana(text) {
  return String(text ?? "")
    .replace(
      /[\u30A1-\u30F6]/g,
      (char) =>
        String.fromCharCode(
          char.charCodeAt(0) -
          0x60
        )
    );
}

function getCleanInitial(furigana) {
  if (
    !furigana ||
    !String(furigana).trim()
  ) {
    return "";
  }

  const normalized =
    toHiragana(
      String(furigana)
        .trim()
        .normalize("NFKC")
        .normalize("NFD")
        .replace(
          /[\u3099\u309A]/g,
          ""
        )
        .normalize("NFC")
    );

  const initial =
    Array.from(normalized)[0] ||
    "";

  return (
    SMALL_KANA_MAP[initial] ??
    initial
  );
}

const PRONUNCIATIONS = [
  "あ", "い", "う", "え", "お",
  "か", "き", "く", "け", "こ",
  "さ", "し", "す", "せ", "そ",
  "た", "ち", "つ", "て", "と",
  "な", "に", "ぬ", "ね", "の",
  "は", "ひ", "ふ", "へ", "ほ",
  "ま", "み", "む", "め", "も",
  "や", "ゆ", "よ",
  "ら", "り", "る", "れ", "ろ",
  "わ", "を", "ん",
];

const PRONUNCIATION_MAP =
  new Map(
    PRONUNCIATIONS.map(
      (pronunciation, index) => [
        pronunciation,
        index + 1,
      ]
    )
  );

exports.addPronunciationId =
  function addPronunciationId(
    children
  ) {
    return children.map(
      (child) => {
        const initial =
          getCleanInitial(
            child.furigana || ""
          );

        return {
          ...child,
          initial,
          pronunciation_id:
            PRONUNCIATION_MAP.get(
              initial
            ) ?? null,
        };
      }
    );
  };
