# Hug Client の更新

更新確認・自動ダウンロード・再起動は `../updateManager.js` の electron-updater を使用します。
配信先は `package.json` の `build.publish` にある GitHub Releases (`higayu/hug-client`) です。
起動5秒後と設定画面の手動チェックから確認できます。ダウンロード完了後に再起動を確認します。

`index.js` は既存Preload用のIPCを登録します。更新確認の返却形式は `{ success, data }` です。
Laravel版の `version.js` / `download.js` / `install.js` は使用しません。
他アプリの差分を反映するときも、このリポジトリのGitHub配信方式を維持してください。
