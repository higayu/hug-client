export const ADMIN_SECTION_IDS = {
  STAFF_MANAGEMENT: 'staff-management',
  WEB_AUTOMATION: 'web-automation',
}

export const ADMIN_SECTIONS = [
  {
    id: ADMIN_SECTION_IDS.STAFF_MANAGEMENT,
    label: '職員管理',
    description: '職員の基本情報・ログイン情報を編集します。',
  },
  {
    id: ADMIN_SECTION_IDS.WEB_AUTOMATION,
    label: 'Web自動化 V2',
    description:
      'web_automation_flows_v2 / files_v2 / flow_memos_v2 / execution_logs_v2 を確認・編集します。',
  },
]
