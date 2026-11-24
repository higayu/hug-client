import { resolveAiMode } from '../utils/aiModePolicy.js'

// Validate the AI mode on every action, including direct appState updates.
export function withAiModePolicy(reducer) {
  return (state, action) => {
    const next = reducer(state, action)
    const mode = resolveAiMode(next.auth, next.appState.USE_AI)
    return next.appState.USE_AI === mode ? next : { ...next, appState: { ...next.appState, USE_AI: mode } }
  }
}
