# 個人記録の個別取得
- 日別取得・登録確認は共通 fetchPersonalRecordV2 経由で Flow 38 に変更。
- 月別画面では期間指定を初期値とし、admin/mentor のみ Flow 6 に切替可能。
- Flow 38 は開始・終了日を含め最大30日、月またぎ可。
- Flow 8 と既存保存処理は維持。サーバー側の権限制御は別途必要。
- PersonalRecord フォルダを既存の common/hug_function/PersonalRecord に上書きする。
- Flow 38 の公開後に動作確認すること。
