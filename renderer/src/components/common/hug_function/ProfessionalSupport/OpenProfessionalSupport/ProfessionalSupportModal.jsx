import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { isEditPage, readProfessionalSupport, writeProfessionalSupport, writeProfessionalSupportDraft } from './parts/professionalSupportWebview.js'

function Controls({webview,data,tab}) {
  const [open,setOpen]=useState(true), [active,setActive]=useState(true), [form,setForm]=useState(data), [message,setMessage]=useState(''), [busy,setBusy]=useState(false), [submitted,setSubmitted]=useState(false)
  const lock=useRef(false), first=useRef(true)
  useEffect(()=>{
    const sync=()=>{const s=getComputedStyle(webview); setActive(webview.isConnected && s.display!=='none' && s.visibility!=='hidden' && webview.getClientRects().length>0)}
    const observer=new MutationObserver(sync); observer.observe(document.getElementById('tabs')||tab,{attributes:true,subtree:true}); observer.observe(webview,{attributes:true}); const timer=setInterval(sync,250); sync()
    const navigation=()=>setOpen(false); webview.addEventListener('did-start-loading',navigation)
    return()=>{observer.disconnect();clearInterval(timer);webview.removeEventListener('did-start-loading',navigation)}
  },[webview,tab])
  const change=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  async function reopen(){ if(lock.current||submitted)return; try{const current=await readProfessionalSupport(webview,data);setForm(f=>({...f,...current,contents:first.current?f.contents:current.contents}));setOpen(true)}catch(e){setMessage(e.message)} }
  async function apply(save){
    if(lock.current||submitted)return; lock.current=true;setBusy(true);setMessage('')
    try{
      if(!form.contents.trim()||!form.title.trim())throw new Error('項目名と記録内容を入力してください')
      if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.startTime)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.endTime)||form.startTime>=form.endTime)throw new Error('開始・終了時刻を確認してください')
      if(!save) await writeProfessionalSupport(webview,form);first.current=false
      if(save){ await writeProfessionalSupportDraft(webview,form);setSubmitted(true);setMessage('下書き保存ボタンを押しました。HUG画面で結果を確認してください。専門＋は管理パネルから登録してください。') }
      else setMessage('入力欄に反映しました（未保存）')
      setOpen(false)
    }catch(e){setMessage(e.message||String(e))}finally{lock.current=false;setBusy(false)}
  }
  if(!active)return null
  return <><div className="fixed right-5 top-1/2 z-[19000] rounded bg-slate-900 p-3 text-white shadow-lg max-w-sm"><button type="button" disabled={busy||submitted} onClick={reopen} className="rounded bg-green-700 px-3 py-2 disabled:opacity-50">専門的支援 入力</button>{message&&<p role="status" className="mt-2 text-sm">{message}</p>}</div>
  {open&&<div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="専門的支援加算"><section className="w-full max-w-3xl max-h-[90vh] overflow-auto rounded-lg bg-white p-5 text-slate-900 shadow-xl space-y-3"><h2 className="text-lg font-bold">専門的支援加算：{data.childName||data.childId}</h2><p className="text-sm">実施日：{data.dateStr} ／ 施設ID：{data.facilityId} ／ 職員ID：{data.staffId}</p><details><summary>専門的支援計画（参照）</summary><p className="whitespace-pre-wrap text-sm">{data.professionalPlanNotes||'計画なし'}</p></details><div className="grid grid-cols-2 gap-3">{[['startTime','開始時刻'],['endTime','終了時刻']].map(([k,label])=><label key={k}>{label}<input type="time" className="block w-full rounded border p-2" value={form[k]} onChange={change(k)} disabled={busy}/></label>)}</div><label className="block">項目名<input className="block w-full rounded border p-2" value={form.title} onChange={change('title')} disabled={busy}/></label><label className="block">記録内容（一時メモ2）<textarea className="block w-full rounded border p-3" rows={12} value={form.contents} onChange={change('contents')} disabled={busy}/></label>{!form.facilityVerified&&<p className="text-sm text-amber-800">施設をDOMで確認できないため、反映後にHUG画面で確認して手動保存してください。</p>}{message&&<p role="alert" className="text-sm">{message}</p>}<footer className="flex flex-wrap justify-end gap-2"><button disabled={busy} onClick={()=>setOpen(false)} className="rounded border px-4 py-2">閉じる</button><button disabled={busy} onClick={()=>apply(false)} className="rounded bg-green-700 px-4 py-2 text-white">入力欄に反映</button><button disabled={busy||submitted||!form.facilityVerified} onClick={()=>apply(true)} className="rounded bg-purple-700 px-4 py-2 text-white disabled:opacity-50">反映して下書き保存</button></footer></section></div>}</>
}
export function mountProfessionalSupportControls(webview,data,tab){
  const host=document.createElement('div');host.dataset.professionalSupportControls=webview.id;document.body.appendChild(host);const root=createRoot(host);let disposed=false
  const destroy=()=>{if(disposed)return;disposed=true;observer.disconnect();root.unmount();host.remove()};const observer=new MutationObserver(()=>{if(!webview.isConnected)destroy()});observer.observe(document.body,{childList:true,subtree:true});root.render(<Controls webview={webview} data={data} tab={tab}/>);return {destroy}
}
