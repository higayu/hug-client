# Flow 38 下書きデバッグ修正
Laravel と renderer の同名ファイルを上書きしてください。通常実行は公開版のみ。認証済み admin + DEBUG_FLG=true の Flow 38 は下書き専用 API を利用します。他 Flow は通常公開版、既存の明示的 revisionMode: 'draft' は維持。明示的 published は自動切替を無効化します。下書きがなければエラーとなり公開版に代替しません。
Laravel は会社自動化許可・Flow利用権限を維持し、developer_mode の場合のみサーバー側 admin 判定後に draft/published の Flow 本体を検索します。Flow 38 の admin 利用権限は別途必要です。
既存 preload の webAutomationV2_getDraftTestFlowBundle が developer_mode=1 を送信し meta を返す必要があります。main/preload は添付に含まれないため未確認です。
注意: デバッグ実行も実際の WebView 操作・保存を行います。テスト環境で確認してください。
確認: PHP lint、JS 構文チェック。実環境・ビルド未確認。
