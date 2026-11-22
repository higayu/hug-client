const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const vm = require("node:vm");
const esbuild = require("esbuild");

const code = esbuild.buildSync({
  entryPoints: [path.join(__dirname, "../renderer/src/components/common/AiContents/LaravelApiContent/send/sendPromptToLaravelApi.js")],
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  external: ["../../common/webAutomation/executeAiAutomationFlow.js"],
}).outputFiles[0].text;

function setup(response = { success: true, data: { success: true, message: "Generated record" } }) {
  const calls = [];
  const compiled = { exports: {} };
  const api = (mode) => async (payload) => {
    calls.push({ mode, payload: JSON.parse(JSON.stringify(payload)) });
    return response;
  };
  vm.runInNewContext(code, {
    module: compiled,
    exports: compiled.exports,
    console: { error() {} },
    window: { electronAPI: {
      laravel_aiRecordEditer_correctPersonalRecord: api("standard"),
      laravel_aiRecordEditer_correctPersonalRecordWithPlan: api("with-plan"),
      laravel_aiRecordEditer_correctProfessionalSupport: api("professional"),
    } },
    require() { return { executeAiAutomationFlow() { throw new Error("Unexpected automation call"); } }; },
  });
  return { send: compiled.exports.sendPromptToLaravelApi, calls };
}

const input = { promptKey: "personal", childId: 7, prompt: " Prompt ", message: " Record " };

test("standard correction sends the selected prompt and message without a plan", async () => {
  const { send, calls } = setup();
  assert.equal(await send({ ...input, personalRecordMode: "standard" }), "Generated record");
  assert.deepEqual(calls, [{ mode: "standard", payload: { prompt: "Prompt", message: "Record" } }]);
});

test("plan generation and the default send only child ID and message", async () => {
  for (const mode of [undefined, "with-plan"]) {
    const { send, calls } = setup();
    await send({ ...input, prompt: "", personalRecordMode: mode });
    assert.deepEqual(calls, [{ mode: "with-plan", payload: { child_id: 7, message: "Record" } }]);
  }
});

test("invalid input does not invoke an API", async () => {
  const { send, calls } = setup();
  await assert.rejects(send({ ...input, personalRecordMode: "standard", prompt: " " }), /プロンプト/);
  await assert.rejects(send({ ...input, personalRecordMode: "with-plan", childId: null }), /対象児童/);
  await assert.rejects(send({ ...input, personalRecordMode: "unknown" }), /書き方/);
  assert.equal(calls.length, 0);
});

test("professional support sends its plan payload to the single-stage API", async () => {
  const { send, calls } = setup();
  await send({ ...input, promptKey: "professional1" });
  assert.deepEqual(calls, [{ mode: "professional", payload: { child_id: 7, message: "Record" } }]);
});

test("both personal modes propagate API failures and reject empty responses", async () => {
  for (const personalRecordMode of ["standard", "with-plan"]) {
    const failed = setup({ success: false, message: "Generation failed", error: { status: 502 } });
    await assert.rejects(failed.send({ ...input, personalRecordMode }), (error) => error.status === 502);
    const empty = setup({ success: true, data: { success: true, message: " " } });
    await assert.rejects(empty.send({ ...input, personalRecordMode }), (error) => error.code === "EMPTY_RESPONSE");
  }
});
