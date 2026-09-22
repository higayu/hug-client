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
    label: 'Web自動化',
    description:
      'web_automation_rules / flows / flow_steps を確認・編集します。',
  },
]
