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
    key: 'F_SOAIP',
    itemId: 50,
    label: 'F-SOAIP',
  },
  { key: 'F_SOAIP2', itemId: 51, label: 'F-SOAIP2' },
  { key: 'healthAnalysis', itemId: 100, label: '健康状態の分析' },
  { key: 'recordSummary', itemId: 150, label: '問い合わせ（個人記録の要約）' },
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

  F_SOAIP: `あなたは、児童支援記録の校正・整理を行うアシスタントです。

入力された支援記録の内容を整理・校正し、以下の【S】【O】【A】【P】形式（SOAP形式）で、日本語で出力してください。

* **S（Subjective Data：主観的情報）**
  ご本人やご家族さまからの訴え、発言、希望、感想などの主観的な情報を記載してください。

* **O（Objective Data：客観的情報）**
  支援者が観察した事実、本人の行動や様子、バイタル・回数・時間などの数値情報を記載してください。

* **A（Assessment：評価・アセスメント）**
  SおよびOの情報をもとに、本人の状態や課題、変化、支援上の評価・考察を記載してください。

* **P（Plan：計画）**
  Aの評価をもとに、今後の支援方針、対応方法、継続して観察する事項などを記載してください。

### 校正時のルール

* 入力された記録の内容や事実を変えないでください。
* 入力されていない事実を推測して追加しないでください。
* 支援記録として自然で、簡潔かつ客観的な文章に整えてください。
* 本人やご家族さまに配慮した、丁寧で適切な表現を使用してください。
* S・O・A・Pの内容が重複しすぎないよう整理してください。
* 判断できる情報がない項目については、無理に内容を補完しないでください。

### 出力形式

**【S】**
（主観的情報）

**【O】**
（客観的情報）

**【A】**
（評価・アセスメント）

**【P】**
（今後の支援・計画）
`,
}
