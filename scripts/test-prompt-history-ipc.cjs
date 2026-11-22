const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../electron/main/parts/handlers/laravelAuthHandler/promptHistories.js'), 'utf8');
function setup(failure) {
  const calls=[];
  const module={exports:{}};
  vm.runInNewContext(source, {module, exports:module.exports, require(name) {
    if(name.endsWith('laravelApiClient')) return {
      get:async(...args)=>{calls.push(['get',...JSON.parse(JSON.stringify(args))]);return {success:true,data:{test:'listed'}}},
      post:async(...args)=>{calls.push(['post',...JSON.parse(JSON.stringify(args))]);return {success:true,data:{test:'restored'}}},
    };
    if(name.endsWith('auth/authenticated')) return {executeAuthenticatedOperation:async operation=>failure??operation()};
    if(name.endsWith('auth/utils')) return {unwrapData:result=>result.data,formatError:error=>({success:false,message:error.message})};
    throw Error(name);
  }});
  return {...module.exports,calls};
}

test('history handlers use fixed routes and send the expected current version',async()=>{
  const api=setup();
  assert.equal((await api.listHandler(null,{promptId:12,page:2})).data.test,'listed');
  await api.showHandler(null,{promptId:12,historyId:40});
  await api.restoreHandler(null,{promptId:12,historyId:40,expectedHistoryId:50});
  assert.deepEqual(api.calls,[['get','/ai-prompts/12/histories',{params:{page:2}}],['get','/ai-prompts/12/histories/40'],['post','/ai-prompts/12/histories/40/restore',{expected_history_id:50}]]);
});

test('invalid identifiers do not call HTTP and server conflicts are preserved',async()=>{
  const api=setup();
  assert.equal((await api.listHandler(null,{promptId:'../other'})).success,false);
  assert.equal((await api.restoreHandler(null,{promptId:12,historyId:40,expectedHistoryId:0})).success,false);
  assert.equal(api.calls.length,0);
  const failure={success:false,message:'Changed by another editor',error:{status:409}};
  assert.equal(await setup(failure).restoreHandler(null,{promptId:12,historyId:40,expectedHistoryId:50}),failure);
});
