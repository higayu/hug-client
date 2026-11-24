const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require('esbuild');

const project = path.join(__dirname, '..');
const policy = require('../src/aiModePolicy.json');
const code = esbuild.buildSync({
  stdin: { contents: `export * from './renderer/src/utils/aiModePolicy.js'; export * from './renderer/src/store/aiModeReducer.js';`, resolveDir: project },
  bundle: true, platform: 'node', format: 'cjs', write: false,
}).outputFiles[0].text;
const compiled = { exports: {} };
vm.runInNewContext(code, { module: compiled, exports: compiled.exports });
const { canChooseAiMode, resolveAiMode, withAiModePolicy } = compiled.exports;
const auth = (role) => ({ authenticated: true, hasAccessToken: true, status: 'authenticated', user: { role_code: role } });

test('all users may choose an allowed AI mode regardless of authentication or role', () => {
  for (const role of ['admin', 'mentor', 'franchise_mentor', 'staff', 'franchise_staff', '', null]) {
    assert.equal(canChooseAiMode(auth(role)), true);
    assert.equal(resolveAiMode(auth(role), 'gemini'), 'gemini');
  }
  for (const value of [null, {}, { ...auth('admin'), authenticated: false }, { ...auth('admin'), hasAccessToken: false }, { ...auth('admin'), status: 'loading' }]) {
    assert.equal(canChooseAiMode(value), true);
    assert.equal(resolveAiMode(value, 'gemini'), 'gemini');
  }
});

test('invalid selections fall back to the default mode', () => {
  assert.equal(resolveAiMode(auth('admin'), 'unknown'), 'LaravelApi');
});

test('root reducer preserves valid selections across account role changes', () => {
  const reducer = withAiModePolicy((state, action) => ({ ...state, ...action.payload }));
  let state = { auth: auth('staff'), appState: { USE_AI: 'gemini', keep: 1 } };
  state = reducer(state, {});
  assert.equal(state.appState.USE_AI, 'gemini');
  assert.equal(state.appState.keep, 1);
  state = reducer(state, { payload: { auth: auth('admin'), appState: { USE_AI: 'gemini' } } });
  assert.equal(state.appState.USE_AI, 'gemini');
  state = reducer(state, { payload: { auth: auth('franchise_staff') } });
  assert.equal(state.appState.USE_AI, 'gemini');
});

function mainPolicy(role, { token = true, failure = false } = {}) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(project, 'electron/main/parts/readfile/iniHandler/aiModePolicy.js'), 'utf8'), {
    module, exports: module.exports,
    require(id) {
      if (id.endsWith('aiModePolicy.json')) return policy;
      if (id.endsWith('laravelApiClient')) return {
        getAccessToken: () => token ? 'fake' : null,
        me: async () => failure ? { success: false } : { success: true, user: { role_code: role } },
      };
      throw new Error(`Unexpected module ${id}`);
    },
  });
  return module.exports;
}

test('Main preserves allowed modes without checking the account role', async () => {
  const settings = { apiSettings: { useAI: 'gemini' }, role_code: 'admin' };
  for (const role of ['admin', 'mentor', 'franchise_mentor', 'staff', 'franchise_staff']) {
    const result = await mainPolicy(role).enforceAiMode(settings);
    assert.equal(result.apiSettings.useAI, 'gemini');
  }
  assert.equal((await mainPolicy('admin', { token: false }).enforceAiMode(settings)).apiSettings.useAI, 'gemini');
  assert.equal((await mainPolicy('admin', { failure: true }).enforceAiMode(settings)).apiSettings.useAI, 'gemini');
  assert.equal((await mainPolicy('staff').enforceAiMode({ apiSettings: { useAI: 'unknown' } })).apiSettings.useAI, 'LaravelApi');
  assert.equal(settings.apiSettings.useAI, 'gemini');
});

test('INI read and writes preserve allowed AI modes for every user', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hug-ai-policy-'));
  const filename = path.join(directory, 'ini.json');
  try {
    fs.writeFileSync(filename, JSON.stringify({ version: 'test', apiSettings: { useAI: 'gemini', facilityId: '3' } }));
    const defaults = { version: 'test', apiSettings: { useAI: 'LaravelApi' } };
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(project, 'electron/main/parts/readfile/iniHandler/index.js'), 'utf8'), {
      module, exports: module.exports, console,
      require(id) {
        if (id === 'fs') return fs;
        if (id === 'path') return path;
        if (id === '../../utils/pathResolver') return { getIniPath: () => filename };
        if (id === './defaultIni') return { DEFAULT_INI: defaults, getDefaultIni: () => JSON.parse(JSON.stringify(defaults)), normalizeMemoAutoSaveSettings() {} };
        if (id === './aiModePolicy') return mainPolicy('staff');
        throw new Error(`Unexpected module ${id}`);
      },
    });
    const handlers = {};
    module.exports.handleIniAccess({ removeHandler() {}, handle(name, handler) { handlers[name] = handler; } });
    assert.equal((await handlers['read-ini']()).data.apiSettings.useAI, 'gemini');
    assert.equal(JSON.parse(fs.readFileSync(filename)).apiSettings.useAI, 'gemini');
    await handlers['save-ini'](null, { apiSettings: { useAI: 'openrouter' } });
    assert.equal(JSON.parse(fs.readFileSync(filename)).apiSettings.useAI, 'openrouter');
    const result = await handlers['update-ini-setting'](null, 'apiSettings.useAI', 'chatGPT');
    assert.equal(result.data.apiSettings.useAI, 'chatGPT');
    assert.equal(result.data.apiSettings.facilityId, '3');
    assert.equal(JSON.parse(fs.readFileSync(filename)).apiSettings.useAI, 'chatGPT');
  } finally {
    if (fs.existsSync(filename)) fs.unlinkSync(filename);
    fs.rmdirSync(directory);
  }
});
