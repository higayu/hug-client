const client = require('../../../../../src/laravelApiClient');
const policy = require('../../../../../src/aiModePolicy.json');

// Only a fresh response from Laravel can authorize a non-Laravel AI selection.
// Local settings, staff IDs and renderer-supplied role flags are not authoritative.
async function enforceAiMode(data) {
  let useAI = policy.defaultMode;
  const requested = data?.apiSettings?.useAI;
  if (policy.allowedModes.includes(requested) && requested !== policy.defaultMode && client.getAccessToken?.()) {
    try {
      const result = await client.me();
      const user = result?.user ?? result?.data?.user;
      if (result?.success === true && policy.managementRoles.includes(user?.role_code)) {
        useAI = requested;
      }
    } catch {
      // Unavailable or expired authentication must never enable other AI modes.
    }
  }
  return { ...data, apiSettings: { ...data?.apiSettings, useAI } };
}

module.exports = { enforceAiMode };
