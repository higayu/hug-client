PersonalRecordLaravelLoader
===========================

Laravelから対象施設・対象月の個人記録を全件取得し、そのまま一覧表示するコンポーネントです。

検索条件:
- facility_id: 必須
- target_month: 必須 (YYYY-MM)
- item_id: 1 (個人記録)
- day_of_week_id: null
- children_id: 使用しない

呼び出し例:

<PersonalRecordLaravelLoader
  facilityId={facilityId}
  targetMonth={targetMonth}
  reloadSeq={reloadSeq}
/>

取得したデータはReduxの setServiceRecord にも保存します。
onLoaded / onError / onLoadingChange の既存コールバックも継続利用できます。
