import policy from '../../../src/aiModePolicy.json'

export const FORCED_AI_MODE = policy.defaultMode

export function canChooseAiMode() {
  // AI種別は端末ごとの設定なので、ログイン状態や職員権限にかかわらず
  // すべての利用者が変更できる。
  return true
}

export function resolveAiMode(_auth, requested) {
  return policy.allowedModes.includes(requested) ? requested : FORCED_AI_MODE
}

export const selectCanChooseAiMode = (state) => canChooseAiMode(state.auth)
