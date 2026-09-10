export const PROMPT_DEFINITIONS = [
  {
    key: 'personalRecord',
    itemId: 1,
    label: '個人記録1',
  },
  {
    key: 'personalRecord2',
    itemId: 4,
    label: '個人記録2',
  },
  {
    key: 'professional1',
    itemId: 2,
    label: '専門的支援1',
  },
  {
    key: 'professional2',
    itemId: 3,
    label: '専門的支援2',
  },
  {
    key: 'F-SOAIP',
    itemId: 50,
    label: 'F-SOAIP',
  },
]

export const DEFAULT_PROMPTS = {
  personalRecord:
    '放課後等デイサービスの児童対応の記録として文章を下記の文章を整えて',

  personalRecord2:
    '上記の個別支援計画の内容に従った児童対応を行った場合の児童対応の記録を下記の活動内容を参考に作文して',

  professional1:
    '上記の内容に含まれる部分を下記の内容から抽出して',

  professional2:
    '抽出結果をまとめて文章を作成して',
}
