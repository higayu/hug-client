【AllSyncButton】

実行順:
1. 職員データ取得
2. 職員DB同期
3. 児童データ取得
4. 児童DB同期
5. 個人記録一覧取得
6. 個人記録本文取得
7. 個人記録Laravel保存

途中でエラーが発生した場合は、その時点で停止します。

使用例:

import AllSyncButton from '@/components/common/Synchronization/AllSyncButton'

<AllSyncButton
  webviewRef={webviewRef}
  webviewReady={webviewReady}
  facilityId={facilityId}
  year={year}
  month={month}
  setLoading={setLoading}
  setSending={setSending}
  setError={setError}
  setData={setData}
  setSendError={setSendError}
  setSendResult={setSendResult}
/>

注意:
- fetchStaffData.js / fetchChildrenData.js は既存の単体同期用実装を参照しています。
- 個人記録取得・保存ロジックは AllSyncButton ディレクトリ内に専用コピーを持っています。
- 既存の StaffChildrenUpdateButton / SyncPersonRecordButton を呼び出しているわけではありません。
