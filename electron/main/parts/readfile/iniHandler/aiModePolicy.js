const policy = require('../../../../../src/aiModePolicy.json');

async function enforceAiMode(data) {
  const requested = data?.apiSettings?.useAI;
  // AI種別は端末設定として全利用者が変更できる。権限による補正はせず、
  // 未知の値だけを安全なデフォルトへ戻す。
  const useAI = policy.allowedModes.includes(requested)
    ? requested
    : policy.defaultMode;
  return { ...data, apiSettings: { ...data?.apiSettings, useAI } };
}

module.exports = { enforceAiMode };
