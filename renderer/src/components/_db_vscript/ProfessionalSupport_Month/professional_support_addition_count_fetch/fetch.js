exports.fetchProfessionalSupportAdditionCount =
  async function ({ input, helpers, config }) {
    return await helpers.executeFunctionInWebview({
      functionText: `
        async function ({ facilityId, targetDate, config }) {
          const parts = String(targetDate ?? '').split('-');
          const request = { url:config.request.url, facilityId:String(facilityId ?? ''), year:String(Number(parts[0])||''), month:String(Number(parts[1])||'') };
          const readControlValue=(doc,name)=>String(doc.querySelector('select[name="'+name+'"], input[name="'+name+'"]')?.value ?? '').trim();
          if (!request.facilityId || !request.year || !request.month) {
            const initialResponse=await fetch(request.url,{method:'GET',credentials:'include',cache:'no-store'});
            if(!initialResponse.ok) throw new Error('加算項目管理画面の初期情報を取得できませんでした (HTTP '+initialResponse.status+')');
            const initialDoc=new DOMParser().parseFromString(await initialResponse.text(),'text/html');
            if(!request.facilityId) request.facilityId=readControlValue(initialDoc,'f_id');
            if(!request.year) request.year=readControlValue(initialDoc,'s_year');
            if(!request.month) request.month=readControlValue(initialDoc,'s_month');
          }
          if(!request.facilityId) throw new Error('加算項目管理画面の施設IDを取得できませんでした。');
          if(!request.year || !request.month) throw new Error('加算項目管理画面の対象年月を取得できませんでした。');
          const body=new URLSearchParams({mode:'search',f_id:request.facilityId,s_year:request.year,s_month:request.month,c_id:'0'});
          const response=await fetch(request.url,{method:'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:body.toString()});
          if(!response.ok) throw new Error('加算数データの取得に失敗しました (HTTP '+response.status+')');
          const doc=new DOMParser().parseFromString(await response.text(),'text/html');
          const calendar=doc.querySelector('.calendar');
          if(!calendar){const title=doc.querySelector('title')?.textContent?.trim()??'';throw new Error(title?'加算カレンダーを取得できませんでした。HUGのログイン状態を確認してください。 ('+title+')':'加算カレンダーを取得できませんでした。HUGのログイン状態を確認してください。');}
          const heading=doc.querySelector('.ibox-title h3')?.textContent?.replace(/\\s+/g,' ').trim()??'';
          const days=Array.from(calendar.querySelectorAll('td[id^="td_"]')).map(cell=>{
            const date=cell.id.replace(/^td_/,''); if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) return null;
            const additions=[];
            Array.from(cell.querySelectorAll('ul.adding-calendar-list > li')).forEach(item=>{
              const childList=item.querySelector(':scope > ul'); let name='';
              for(const node of item.childNodes){if(node===childList)break;if(node.nodeType===Node.TEXT_NODE)name+=' '+node.textContent;}
              name=name.replace(/\\s+/g,' ').trim(); if(!name)return;
              const children=Array.from(childList?.querySelectorAll(':scope > li')??[]).map(c=>c.textContent.replace(/\\s+/g,' ').trim()).filter(Boolean);
              additions.push({name,count:children.length,children});
            });
            const professionalSupport=additions.find(a=>a.name==='専門的支援実施加算');
            return {date,professionalSupportCount:professionalSupport?.count??0,professionalSupportChildren:professionalSupport?.children??[],additions};
          }).filter(Boolean);
          return {heading,facilityId:request.facilityId,year:Number(request.year),month:Number(request.month),days};
        }
      `,
      args:[{ facilityId:input?.facilityId, targetDate:input?.targetDate, config }],
    });
  };
