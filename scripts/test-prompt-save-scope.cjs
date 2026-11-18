const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../renderer/src/hooks/usePrompt/upsert/parts/laravel.js'), 'utf8');
const modulePromise = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

async function save(overrides) {
  let sent;
  global.window = { electronAPI: { laravel_procedure_upsertAiPrompt: async (payload) => {
    sent = payload;
    return { success: true, data: [{ prompt_id: 1 }] };
  } } };
  const { upsertAiPrompt } = await modulePromise;
  await upsertAiPrompt({ itemId: 1, companyId: 34, content: 'Test prompt', isActive: true, ...overrides });
  return sent;
}

test('normal company prompts use company_id without the company-only management scope', async () => {
  for (const itemId of [1, 2, 3, 4]) {
    const payload = await save({ itemId });
    assert.equal(payload.company_id, 34);
    assert.equal(Object.hasOwn(payload, 'scope'), false);
  }
});

test('company-only prompts retain the management scope', async () => {
  for (const itemId of [50, 51, 100, 150]) {
    const payload = await save({ itemId });
    assert.equal(payload.company_id, 34);
    assert.equal(payload.scope, 'company');
  }
});

test('personal prompt saving does not supply company scope or override authenticated staff', async () => {
  const payload = await save({ companyId: null, staffId: 999, updatedBy: 999 });
  assert.equal(payload.company_id, null);
  for (const key of ['scope', 'staff_id', 'updated_by']) assert.equal(Object.hasOwn(payload, key), false);
});

test('updates preserve the existing prompt ID and edited content', async () => {
  const payload = await save({ promptId: '12', itemId: '4', companyId: '34', content: 'Updated content' });
  assert.equal(payload.prompt_id, 12);
  assert.equal(payload.item_id, 4);
  assert.equal(payload.content, 'Updated content');
  assert.equal(Object.hasOwn(payload, 'scope'), false);
});
