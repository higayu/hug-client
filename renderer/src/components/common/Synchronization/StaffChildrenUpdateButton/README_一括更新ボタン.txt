【追加ファイル】
StaffChildrenUpdateButton/index.jsx

想定配置:
renderer/src/components/common/Synchronization/StaffChildrenUpdateButton/index.jsx

既存の StaffUpdateButton / ChildrenUpdateButton と同じ Synchronization 配下へ配置してください。

親コンポーネントで以下を追加します。

import StaffChildrenUpdateButton from '@/components/common/Synchronization/StaffChildrenUpdateButton';

表示したい位置へ以下を追加します。

<StaffChildrenUpdateButton />

施設IDやWebViewを既存ボタンへ明示的に渡している場合は、同様に渡せます。

<StaffChildrenUpdateButton
  facilityId={facilityId}
  webview={webview}
/>

処理順:
1. HUG職員データ取得
2. 職員DB同期
3. HUG児童データ取得
4. 児童DB同期
5. 一括同期完了通知

職員同期でエラーが発生した場合は児童同期へ進まず、その時点で停止します。
確認ダイアログは表示しません。
