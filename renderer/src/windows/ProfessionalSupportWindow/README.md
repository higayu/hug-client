# ProfessionalSupportWindow - WebView fetch版

## 方針
- main / preload の追加変更は不要です。
- RightPanel の WebView は HUG のログインセッション確認用です。
- 出席データは WebView の表示DOMから取得しません。
- WebView の `dom-ready` 後に `executeJavaScript()` を呼び、その中の `fetch()` で `attendance.php` をGET/POSTします。
- `credentials: 'include'` により WebView の Cookie / ログインセッションを利用します。
- POSTレスポンスHTMLを `DOMParser` で解析して出席データを生成します。

## 施設IDの解決
ProfessionalSupportWindow のURLに `facilityId` があればそれを優先します。
無い場合は、同一WebViewセッションで `attendance.php` をGETし、返却HTMLのフォームから現在選択されている `facility` を取得してPOSTに使用します。

年月も `targetDate` が無い場合は `attendance.php` のフォームの `s_year` / `s_month` から補完します。

右側WebViewの表示中DOMそのものから施設ID・年月・出席データを取得する処理はありません。

## Header年月指定

- `ProfessionalSupportWindow/index.jsx` が `selectedYear` / `selectedMonth` を共通stateとして保持します。
- 初期値は MainWindow から渡された `targetDate` の年月、未指定時は現在年月です。
- `HeaderComponent` の年・月SelectBoxを変更すると3タブを自動再取得します。
- 出席データ: `attendance.php` の `s_year` / `s_month`
- 加算数データ: `adding_contents_children_2024.php` の `s_year` / `s_month`
- 加算一覧データ: `record_proceedings.php` の `interview_date` / `interview_date_end` を選択月の月初〜月末に設定


## DEBUG: 個人記録前の児童同期テスト

- `PersonalRecordTestPanel` に「児童同期テスト」ボタンを追加。
- WebView セッション内で `GET https://www.hug-ayumu.link/hug/wm/contact_book.php` を実行する。
- 返却HTMLの `#name_list option` から `id` / `name` / `is_delete` を取得する。
- `value=0` の `---` は除外する。
- `[利用停止]` で始まる児童は `is_delete: 1` とする。
- HUG画面上の選択施設IDと ProfessionalSupportWindow の選択施設IDが一致しない場合は誤同期防止のため送信しない。
- preload は `laravel_procedure_registerFacilityChildren(payload)` を優先し、旧API `syncHugChildrens` / `laravel_hug_childrens_sync` もフォールバックとして利用する。
- 送信形式は `{ facility_id, children }`。
- 個人記録一覧取得側でも、一覧POST前の `contact_book.php` GET は維持し、そのGET結果から `hugChildren` / `hugChildCount` も返す。
