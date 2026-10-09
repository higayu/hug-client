children_fetch WebAutomation V2 移行

今回の状態:
- staff_fetch: V2
- children_fetch: V2
- personal_record_list_fetch: V1
- personal_record_detail_fetch: V1

V2 Flow:
children_fetch
  index.js
  fetch.js
  parse.js

Rendererでは executeFlowV2("children_fetch", { facilityId }) を使用します。
旧 fetchChildrenData.js はロールバック比較用として残していますが、新しい呼び出し経路からは参照しません。
