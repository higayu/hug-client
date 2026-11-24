const policy = require('../../../../../src/aiModePolicy.json');

async function enforceAiMode(data) {
  const requested = data?.apiSettings?.useAI;
  // IMPORTANT:
  // hug-client と hug-client-basic では、AI切り替えの仕様が異なる。
  // この hug-client は全利用者がAI種別を自由に変更・保存できる仕様なので、
  // hug-client-basic 側の管理者ロール判定やLaravelApiへの強制固定を
  // 差分反映で復活させないこと。ここでは未知の値だけをデフォルトへ戻す。
  const useAI = policy.allowedModes.includes(requested)
    ? requested
    : policy.defaultMode;
  return { ...data, apiSettings: { ...data?.apiSettings, useAI } };
}

module.exports = { enforceAiMode };
