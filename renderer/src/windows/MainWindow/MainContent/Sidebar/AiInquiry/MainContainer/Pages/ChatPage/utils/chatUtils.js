export function getDefaultPeriod() {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  };
}

export function generateDummyAIResponse(userMessage, childName, records) {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('要約') || lowerMessage.includes('まとめ')) {
    return `【${childName}さんの支援記録の要約】\n\n記録件数: ${records.length}件\n\n主な内容:\n・活動参加状況: 概ね良好で、積極的に参加する様子が見られます。\n・対人関係: 友達との協力やコミュニケーションが取れています。\n・食事: 苦手な食材もありますが、少しずつ挑戦しています。\n・日常生活: 片付けなどの習慣が身についてきています。\n\n総合評価: 順調に成長が見られ、特に社会性の発達が顕著です。継続的な支援が効果を上げています。`;
  }

  if (lowerMessage.includes('傾向') || lowerMessage.includes('パターン')) {
    return `【${childName}さんの行動パターン分析】\n\n📊 傾向分析結果:\n・朝の時間帯は活動的で集中力が高い傾向があります\n・午後の活動では疲れが見られることがあります\n・新しい課題に対しては慎重な姿勢を示しますが、慣れると積極的になります\n・友達との協力活動を好み、良好な関係を築けています\n\n💡 アドバイス:\n・重要な活動は午前中に実施することをお勧めします\n・新しい活動の導入は段階的に行うと良いでしょう\n・グループ活動を積極的に取り入れることで、さらなる成長が期待できます`;
  }

  if (lowerMessage.includes('問題') || lowerMessage.includes('課題') || lowerMessage.includes('改善')) {
    return `【${childName}さんの課題と改善案】\n\n🔍 現在の課題:\n・午後の活動中に集中力が低下しやすい\n・苦手な食材に対する抵抗感がある\n\n💡 改善提案:\n・午後は短い活動を複数用意し、集中力が続くように工夫する\n・食材を少しずつ慣らすアプローチ（少量から始める、楽しい雰囲気で食べるなど）\n・成功体験を増やすための小さな目標設定\n・保護者との連携を強化し、家庭での取り組みも統一する\n\nこれらの対策を継続的に実施することで、改善が期待できます。`;
  }

  if (lowerMessage.includes('進捗') || lowerMessage.includes('成長')) {
    return `【${childName}さんの成長と進捗】\n\n📈 最近の進捗状況:\n✅ 社会性の発達: 友達との協力ができるようになってきた\n✅ 自己管理能力: 片付けなどの習慣が身についてきた\n✅ 集中力: 興味のある活動では長時間集中できる\n\n📊 評価:\n全体的に順調な成長が見られます。特に社会性の発達が顕著で、集団活動への参加も増えています。引き続き現在の支援を継続し、個々の特性に合わせたアプローチを心がけましょう。`;
  }

  const randomResponses = [
    `${childName}さんについてのご質問ありがとうございます。現在のところ、記録には${records.length}件のデータがあります。何か特定の期間や活動について詳しく知りたいことはありますか？`,
    `承知しました。${childName}さんの支援記録を確認しています。もう少し具体的な内容についてお聞かせいただけますか？`,
    `${childName}さんの記録を分析しています。${records.length}件のデータから、いくつかの興味深いパターンが見えてきました。ご希望のテーマがあればお知らせください。`,
    `かしこまりました。${childName}さんの支援に関する情報を整理しています。具体的には、どのような点についてお知りになりたいですか？`,
  ];

  return randomResponses[Math.floor(Math.random() * randomResponses.length)];
}
