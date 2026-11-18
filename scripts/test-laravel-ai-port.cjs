const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadHandler(name, client) {
  const filename = path.join(__dirname, '../electron/main/parts/handlers/laravelAuthHandler', name);
  const module = { exports: {} };
  const requireMock = (id) => {
    if (id.endsWith('/src/laravelApiClient')) return client;
    if (id === './auth/authenticated') return { executeAuthenticatedOperation: (operation) => operation() };
    if (id === './auth/utils') return {
      unwrapData: (value) => value?.data ?? value,
      formatError: (error) => ({ success: false, message: error.message }),
    };
    throw new Error(`Unexpected dependency: ${id}`);
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), { module, exports: module.exports, require: requireMock, console }, { filename });
  return module.exports;
}

test('personal plan and professional two-stage IPC handlers send only child ID and input to the right APIs', async () => {
  const sent = [];
  const api = loadHandler('aiRecordEditer.js', { post: async (url, payload, options) => {
    sent.push({ url, payload, options });
    return { success: true, type: 'text', message: 'Result' };
  } });
  const payload = { child_id: '7', message: ' Input ', prompt: 'Not sent', plan: 'Not sent' };
  assert.equal((await api.personalWithPlanHandler(null, payload)).success, true);
  assert.equal((await api.professionalTwoStageHandler(null, payload)).success, true);
  assert.equal(sent[0].url, '/ai-record-editer/personal-record/with-plan/correct');
  assert.equal(sent[1].url, '/ai-record-editer/professional-support/two-stage/correct');
  for (const entry of sent) assert.equal(JSON.stringify(entry.payload), JSON.stringify({ child_id: 7, message: 'Input' }));
  assert.equal(sent[1].options.timeout, 600000);
});

test('invalid child IDs are rejected before calling Laravel', async () => {
  let count = 0;
  const api = loadHandler('aiRecordEditer.js', { post: async () => { count += 1; } });
  const previousError = console.error;
  console.error = () => {};
  try {
    assert.equal((await api.personalWithPlanHandler(null, { child_id: 0, message: 'Input' })).success, false);
  } finally { console.error = previousError; }
  assert.equal(count, 0);
});

test('AI settings IPC uses the authenticated summary endpoint and preserves its data', async () => {
  const api = loadHandler('aiChat.js', { get: async (url) => {
    assert.equal(url, '/ai/settings');
    return { success: true, data: { model: 'server-model', budget: { remaining: 123 } } };
  } });
  const result = await api.settingsHandler();
  assert.equal(result.success, true);
  assert.equal(result.data.model, 'server-model');
  assert.equal(result.data.budget.remaining, 123);
});
