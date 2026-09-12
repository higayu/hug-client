/**
 * HTML属性から取得した JavaScript 文字列に含まれる
 * 最低限のHTMLエンティティを通常文字へ戻す。
 *
 * HUG側の onclick は例として以下の形式になる場合がある。
 * sendEnterMail(&#39;48627&#39;,0,90,3,1,0,&#39;2026-09-12&#39;,0,0,0);
 */
export function decodeHtmlEntities(value) {
  return String(value ?? "")
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&quot;|&#34;|&#x22;/gi, '"')
    .replace(/&amp;/gi, "&");
}
