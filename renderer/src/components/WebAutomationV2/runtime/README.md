# runtime

このディレクトリに業務JSを物理配置しません。

`executeFlowV2` 実行時にDBの `web_automation_files_v2` から取得したファイル群を
`moduleLoader.js` がメモリ上の仮想モジュールとして構築します。

例（DB上の仮想構造）:

attendance_fetch_today_users/
- index.js
- fetch.js
- parse.js

DB側のJavaScriptはCommonJS形式で記述します。

```js
const { fetchAttendanceHtml } = await require("./fetch");

module.exports = async function execute({ input, helpers, config }) {
  const raw = await fetchAttendanceHtml({ input, helpers, config });
  return raw;
};
```

外部パッケージや `@/...` へのrequireは許可しません。
Electron固有処理は `helpers` 経由で利用します。
