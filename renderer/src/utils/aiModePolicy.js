import policy from '../../../src/aiModePolicy.json'

export const FORCED_AI_MODE = policy.defaultMode

export function canChooseAiMode(auth) {
  return auth?.authenticated === true && auth?.hasAccessToken === true && auth?.status !== 'loading' &&
    policy.managementRoles.includes(auth?.user?.role_code)
}

export function resolveAiMode(auth, requested) {
  return canChooseAiMode(auth) && policy.allowedModes.includes(requested) ? requested : FORCED_AI_MODE
}

export const selectCanChooseAiMode = (state) => canChooseAiMode(state.auth)
