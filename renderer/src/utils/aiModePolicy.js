import policy from '../../../src/aiModePolicy.json'

export const FORCED_AI_MODE = policy.defaultMode

export function canChooseAiMode() {
  // IMPORTANT:
  // hug-client と hug-client-basic では、AI切り替えの仕様が異なる。
  // この hug-client では、AI種別は端末ごとの設定として、ログイン状態や
  // 職員権限にかかわらず全利用者が変更できる仕様である。
  // hug-client-basic の差分を反映するときも、管理者ロールによる制限や
  // LaravelApiへの強制固定をこの処理へ持ち込まないこと。
  return true
}

export function resolveAiMode(_auth, requested) {
  return policy.allowedModes.includes(requested) ? requested : FORCED_AI_MODE
}

export const selectCanChooseAiMode = (state) => canChooseAiMode(state.auth)
