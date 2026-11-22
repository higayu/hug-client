# Electron Main / Preload 公開リビジョン専用パッチ

## 変更
- `getFlowBundle`: Laravel API `meta.revision_number` と `meta.status=published` を必須化。`flow.status=published`、JSファイルの非空・重複・エントリーファイルの存在を検証。旧データへのフォールバックなし。
- 返却 `meta.revisionNumber` / `meta.revision_number` に公開リビジョン番号を追加。従来の `flow` / `files` 構造は維持。
- 管理者向け旧 `adminFlowUpdate` を明示的エラーで停止。JS編集はFilamentの下書きから行う。
- `preload/electronApi.js` で旧直接更新APIを拒否。

## 反映
上記2ファイルを同じパスへ上書き。`preload.bundle.cjs` はビルド成果物なので**ソースから再ビルド**すること（このZIPには含まれません）。

## 注意
- Laravel側の公開版APIが `meta.revision_number`, `meta.status`, `data.flow`, `data.files` を返す必要があります。先のLaravelパッチに準拠。
- `main` / `preload` のみ提供されたためRendererの実行コード・設定画面は未検証。旧管理画面で保存を押すとエラーになります。Rendererも新運用に合わせて改修してください。
- Laravelの `flow.version` と `revision_number` は異なる概念。実行ログの `flow_version` は従来のままであり、リビジョン番号のログDB保存にはLaravel側の追加対応が必要です。
