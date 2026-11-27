const { build } = require('esbuild');
const puppeteer = require('puppeteer');
const assert = require('node:assert/strict');
const path = require('node:path');

async function main() {
  const output = await build({
    stdin: { contents: `import React, {useState} from 'react'; import {createRoot} from 'react-dom/client';
      import Panel from './renderer/src/components/SettingsModal/tabs/PromptTab/PromptHistoryPanel.jsx';
      import {restorePromptHistory} from './renderer/src/hooks/usePrompt/history.js';
      window.calls=[]; window.serverCurrent=102; window.serverCanEdit=true;
      window.electronAPI={
        laravel_aiPromptHistories_list:async p=>{window.calls.push(['list',p]);return {success:true,data:{current_history_id:window.serverCurrent,can_edit:window.serverCanEdit,page:p.page,last_page:2,total:21,histories:p.page===1?[{history_id:102,version:2,is_current:true},{history_id:101,version:1}]:[{history_id:80,version:0}]}}},
        laravel_aiPromptHistories_show:async p=>{window.calls.push(['show',p]);if(window.delayPreview) await new Promise(r=>window.finishPreview=r);return {success:true,data:{history_id:p.historyId,version:p.historyId===101?1:2,content:'HISTORY '+p.historyId}}},
        laravel_aiPromptHistories_restore:async p=>{window.calls.push(['restore',p]);window.serverCurrent=103;return {success:true,data:{current_history_id:103,version:3,content:'HISTORY 101'}}}
      };
      function App(){const [props,setProps]=useState({promptId:1,currentHistoryId:102,canEdit:true,disabled:false,hasDraft:false});window.setPanelProps=p=>setProps(v=>({...v,...p}));
        return <Panel {...props} onUseContent={content=>{window.draft=content;setProps(v=>({...v,hasDraft:true}))}} onRestore={async(historyId,expectedHistoryId)=>{const r=await restorePromptHistory({promptId:props.promptId,historyId,expectedHistoryId});setProps(v=>({...v,currentHistoryId:r.current_history_id}))}}/>}
      createRoot(document.getElementById('root')).render(<App/>);`, resolveDir: process.cwd(), loader: 'jsx' },
    bundle: true, jsx: 'automatic', write: false,
    alias: { '@': path.resolve('renderer/src') },
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  const browser = await puppeteer.launch({headless:true});
  try {
    const page = await browser.newPage();
    const errors=[];
    page.on('pageerror', error=>errors.push(error.message));
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({content:output.outputFiles[0].text});
    const click=async text=>page.evaluate(text=>{
      const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text || b.textContent.trim().startsWith(text+' '));
      if(!button || button.disabled) throw Error('Unavailable button: '+text);
      button.click();
    },text);
    const wait=async text=>page.waitForFunction(text=>document.body.textContent.includes(text),{},text);
    await click('バージョン履歴を開く'); await wait('Ver.1');
    await click('Ver.1'); await page.waitForFunction(()=>document.querySelector('textarea')?.value==='HISTORY 101');
    await click('この内容を編集欄に読み込む');
    assert.equal(await page.evaluate(()=>window.draft),'HISTORY 101');
    assert.equal(await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='この版を復元').disabled),true);
    await page.evaluate(()=>window.setPanelProps({hasDraft:false}));
    await click('この版を復元'); await wait('復元して保存'); await click('復元して保存');
    await page.waitForFunction(()=>window.calls.some(([action])=>action==='restore'));
    assert.deepEqual(await page.evaluate(()=>window.calls.find(([action])=>action==='restore')[1]),{promptId:1,historyId:101,expectedHistoryId:102});
    await wait('Ver.1'); await click('次へ'); await wait('Ver.0');
    assert.equal(await page.evaluate(()=>window.calls.filter(([action])=>action==='list').at(-1)[1].page),2);
    await click('前へ'); await wait('Ver.1');
    await page.evaluate(()=>window.serverCurrent=200); await click('履歴を再取得'); await wait('最新版が変わっています');
    await click('Ver.1'); await page.waitForSelector('textarea');
    assert.equal(await page.evaluate(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='この版を復元')),false);
    await page.evaluate(()=>{window.serverCurrent=103;window.setPanelProps({canEdit:false})});
    await click('履歴を再取得'); await wait('Ver.1'); await click('Ver.1'); await page.waitForSelector('textarea');
    assert.equal(await page.evaluate(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes('編集欄に読み込む'))),false);
    await page.evaluate(()=>window.delayPreview=true); await click('Ver.1'); await wait('本文を読み込んでいます');
    await click('履歴を閉じる'); await click('バージョン履歴を開く'); await wait('Ver.1');
    await page.waitForFunction(()=>![...document.querySelectorAll('button')].find(b=>b.textContent.startsWith('Ver.1')).disabled);
    await page.evaluate(()=>{window.delayPreview=false;window.finishPreview()});
    assert.deepEqual(errors,[]);
    void 0;
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1});
