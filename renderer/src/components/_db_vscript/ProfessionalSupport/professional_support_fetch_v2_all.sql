SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
START TRANSACTION;
SET @app_key = CONVERT('hug-banso-navi' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @flow_key = CONVERT('professional_support_attendance_fetch' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @flow_version = 1;
DELETE FROM web_automation_flows_v2 WHERE app_key COLLATE utf8mb4_unicode_ci=@app_key AND flow_key COLLATE utf8mb4_unicode_ci=@flow_key AND version=@flow_version;
INSERT INTO web_automation_flows_v2 (app_key,flow_key,name,description,entry_file,entry_export,engine_version,config_json,input_schema_json,output_schema_json,timeout_ms,version,status,published_at) VALUES (@app_key,@flow_key,'専門的支援 出席カレンダー取得','専門的支援月次同期用にHUG attendance.phpから出席・欠席カレンダーを取得する。','index.js','default',1,'{"request":{"url":"https://www.hug-ayumu.link/hug/wm/attendance.php"}}','{"type":"object","properties":{"facilityId":{"type":["string","number","null"]},"targetDate":{"type":["string","null"]}}}',NULL,60000,@flow_version,'published',NOW());
SET @flow_id=LAST_INSERT_ID();
INSERT INTO web_automation_files_v2 (flow_id,file_path,file_type,source_text,module_type,config_json,content_hash,is_active) VALUES (@flow_id,'index.js','javascript','const { fetchProfessionalSupportAttendance } = await require("./fetch");
module.exports = async function ({ input, helpers, config }) {
  return await fetchProfessionalSupportAttendance({ input, helpers, config });
};
','commonjs',NULL,SHA2('const { fetchProfessionalSupportAttendance } = await require("./fetch");
module.exports = async function ({ input, helpers, config }) {
  return await fetchProfessionalSupportAttendance({ input, helpers, config });
};
',256),1);
INSERT INTO web_automation_files_v2 (flow_id,file_path,file_type,source_text,module_type,config_json,content_hash,is_active) VALUES (@flow_id,'fetch.js','javascript','exports.fetchProfessionalSupportAttendance =
  async function ({ input, helpers, config }) {
    const result = await helpers.executeFunctionInWebview({
      functionText: `
        async function ({ facilityId, targetDate, config }) {
          const normalizeDate = (value) => {
            const matched = String(value ?? '''').match(/(\\\\d{4})[-/](\\\\d{1,2})[-/](\\\\d{1,2})/);
            if (!matched) return '''';
            return matched[1] + ''-'' + matched[2].padStart(2, ''0'') + ''-'' + matched[3].padStart(2, ''0'');
          };

          const normalizedTargetDate = normalizeDate(targetDate);
          const parts = normalizedTargetDate ? normalizedTargetDate.split(''-'') : [];
          const request = {
            url: config.request.url,
            facilityId: String(facilityId ?? ''''),
            year: String(parts[0] || ''''),
            month: String(Number(parts[1]) || ''''),
          };

          const readControlValue = (doc, names) => {
            for (const name of names) {
              const control = doc.querySelector(
                ''select[name="'' + name + ''"], input[name="'' + name + ''"]''
              );
              if (control && String(control.value ?? '''').trim()) {
                return String(control.value).trim();
              }
            }
            return '''';
          };

          if (!request.facilityId || !request.year || !request.month) {
            const initialResponse = await fetch(request.url, {
              method: ''GET'', credentials: ''include'', cache: ''no-store''
            });
            if (!initialResponse.ok) {
              throw new Error(''出席画面の初期情報を取得できませんでした (HTTP '' + initialResponse.status + '')'');
            }
            const initialHtml = await initialResponse.text();
            const initialDoc = new DOMParser().parseFromString(initialHtml, ''text/html'');
            if (!request.facilityId) {
              request.facilityId = readControlValue(initialDoc, [''facility'',''facility_id'',''f_id'']);
            }
            if (!request.year) request.year = readControlValue(initialDoc, [''s_year'',''year'']);
            if (!request.month) request.month = readControlValue(initialDoc, [''s_month'',''month'']);
          }

          if (!request.facilityId) throw new Error(''attendance.phpのフォームから施設IDを取得できませんでした。'');
          if (!request.year || !request.month) throw new Error(''attendance.phpのフォームから対象年月を取得できませんでした。'');

          const body = new URLSearchParams({
            mode:''search'', facility:request.facilityId, s_year:request.year, s_month:request.month,
            visible:''1'', use_services:''1'', services_sort:''1'', rank_disp:''1'', asc_desc:''1'', visible_event:''0'', visible_staff:''0''
          });
          const response = await fetch(request.url, {
            method:''POST'', credentials:''include'',
            headers:{''Content-Type'':''application/x-www-form-urlencoded;charset=UTF-8''},
            body:body.toString()
          });
          if (!response.ok) throw new Error(''出席データの取得に失敗しました (HTTP '' + response.status + '')'');
          const html = await response.text();
          const documentData = new DOMParser().parseFromString(html, ''text/html'');
          const heading = documentData.querySelector(''.ibox-title h3'')?.textContent?.trim() ?? '''';
          const calendar = documentData.querySelector(''.calendar'');
          if (!calendar) {
            const title = documentData.querySelector(''title'')?.textContent?.trim() ?? '''';
            throw new Error(title ? ''出席カレンダーを取得できませんでした。HUGのログイン状態を確認してください。 (''+title+'')'' : ''出席カレンダーを取得できませんでした。HUGのログイン状態を確認してください。'');
          }
          const days = Array.from(calendar.querySelectorAll(''td[id^="td_"]'')).map((cell) => {
            const date = cell.id.replace(/^td_/, '''');
            if (!/^\\\\d{4}-\\\\d{2}-\\\\d{2}$/.test(date)) return null;
            const sections = Array.from(cell.querySelectorAll(''.calendar-data dt'')).reduce((result,titleElement)=>{
              const type = titleElement.querySelector(''span'')?.textContent?.trim() ?? '''';
              const childItems = Array.from(titleElement.nextElementSibling?.querySelectorAll(''li'') ?? []);
              const names = childItems.map(i=>i.textContent.replace(/\\\\s+/g,'' '').trim()).filter(Boolean);
              const syncNames = childItems.filter(i=>!i.querySelector(''.calendar-pickup'')).map(i=>i.textContent.replace(/\\\\s+/g,'' '').trim()).filter(Boolean);
              const countText = titleElement.querySelector(''b'')?.textContent?.trim();
              const count = countText ? Number(countText) : names.length;
              result[type]={count,names,syncNames};
              return result;
            },{});
            const attendance=sections[''出席'']??{count:0,names:[],syncNames:[]};
            const absence=sections[''欠席'']??{count:0,names:[],syncNames:[]};
            const absenceWithoutAddition=sections[''欠席（加算なし）'']??{count:0,names:[],syncNames:[]};
            return {
              date,
              attendanceCount:attendance.count, attendanceNames:attendance.names, attendanceSyncNames:attendance.syncNames,
              absenceCount:absence.count, absenceNames:absence.names, absenceSyncNames:absence.syncNames,
              absenceWithoutAdditionCount:absenceWithoutAddition.count,
              absenceWithoutAdditionNames:absenceWithoutAddition.names,
              absenceWithoutAdditionSyncNames:absenceWithoutAddition.syncNames,
            };
          }).filter(Boolean);
          return { heading, days, facilityId:request.facilityId, year:Number(request.year), month:Number(request.month) };
        }
      `,
      args: [{ facilityId: input?.facilityId, targetDate: input?.targetDate, config }],
    });
    return result;
  };
','commonjs',NULL,SHA2('exports.fetchProfessionalSupportAttendance =
  async function ({ input, helpers, config }) {
    const result = await helpers.executeFunctionInWebview({
      functionText: `
        async function ({ facilityId, targetDate, config }) {
          const normalizeDate = (value) => {
            const matched = String(value ?? '''').match(/(\\\\d{4})[-/](\\\\d{1,2})[-/](\\\\d{1,2})/);
            if (!matched) return '''';
            return matched[1] + ''-'' + matched[2].padStart(2, ''0'') + ''-'' + matched[3].padStart(2, ''0'');
          };

          const normalizedTargetDate = normalizeDate(targetDate);
          const parts = normalizedTargetDate ? normalizedTargetDate.split(''-'') : [];
          const request = {
            url: config.request.url,
            facilityId: String(facilityId ?? ''''),
            year: String(parts[0] || ''''),
            month: String(Number(parts[1]) || ''''),
          };

          const readControlValue = (doc, names) => {
            for (const name of names) {
              const control = doc.querySelector(
                ''select[name="'' + name + ''"], input[name="'' + name + ''"]''
              );
              if (control && String(control.value ?? '''').trim()) {
                return String(control.value).trim();
              }
            }
            return '''';
          };

          if (!request.facilityId || !request.year || !request.month) {
            const initialResponse = await fetch(request.url, {
              method: ''GET'', credentials: ''include'', cache: ''no-store''
            });
            if (!initialResponse.ok) {
              throw new Error(''出席画面の初期情報を取得できませんでした (HTTP '' + initialResponse.status + '')'');
            }
            const initialHtml = await initialResponse.text();
            const initialDoc = new DOMParser().parseFromString(initialHtml, ''text/html'');
            if (!request.facilityId) {
              request.facilityId = readControlValue(initialDoc, [''facility'',''facility_id'',''f_id'']);
            }
            if (!request.year) request.year = readControlValue(initialDoc, [''s_year'',''year'']);
            if (!request.month) request.month = readControlValue(initialDoc, [''s_month'',''month'']);
          }

          if (!request.facilityId) throw new Error(''attendance.phpのフォームから施設IDを取得できませんでした。'');
          if (!request.year || !request.month) throw new Error(''attendance.phpのフォームから対象年月を取得できませんでした。'');

          const body = new URLSearchParams({
            mode:''search'', facility:request.facilityId, s_year:request.year, s_month:request.month,
            visible:''1'', use_services:''1'', services_sort:''1'', rank_disp:''1'', asc_desc:''1'', visible_event:''0'', visible_staff:''0''
          });
          const response = await fetch(request.url, {
            method:''POST'', credentials:''include'',
            headers:{''Content-Type'':''application/x-www-form-urlencoded;charset=UTF-8''},
            body:body.toString()
          });
          if (!response.ok) throw new Error(''出席データの取得に失敗しました (HTTP '' + response.status + '')'');
          const html = await response.text();
          const documentData = new DOMParser().parseFromString(html, ''text/html'');
          const heading = documentData.querySelector(''.ibox-title h3'')?.textContent?.trim() ?? '''';
          const calendar = documentData.querySelector(''.calendar'');
          if (!calendar) {
            const title = documentData.querySelector(''title'')?.textContent?.trim() ?? '''';
            throw new Error(title ? ''出席カレンダーを取得できませんでした。HUGのログイン状態を確認してください。 (''+title+'')'' : ''出席カレンダーを取得できませんでした。HUGのログイン状態を確認してください。'');
          }
          const days = Array.from(calendar.querySelectorAll(''td[id^="td_"]'')).map((cell) => {
            const date = cell.id.replace(/^td_/, '''');
            if (!/^\\\\d{4}-\\\\d{2}-\\\\d{2}$/.test(date)) return null;
            const sections = Array.from(cell.querySelectorAll(''.calendar-data dt'')).reduce((result,titleElement)=>{
              const type = titleElement.querySelector(''span'')?.textContent?.trim() ?? '''';
              const childItems = Array.from(titleElement.nextElementSibling?.querySelectorAll(''li'') ?? []);
              const names = childItems.map(i=>i.textContent.replace(/\\\\s+/g,'' '').trim()).filter(Boolean);
              const syncNames = childItems.filter(i=>!i.querySelector(''.calendar-pickup'')).map(i=>i.textContent.replace(/\\\\s+/g,'' '').trim()).filter(Boolean);
              const countText = titleElement.querySelector(''b'')?.textContent?.trim();
              const count = countText ? Number(countText) : names.length;
              result[type]={count,names,syncNames};
              return result;
            },{});
            const attendance=sections[''出席'']??{count:0,names:[],syncNames:[]};
            const absence=sections[''欠席'']??{count:0,names:[],syncNames:[]};
            const absenceWithoutAddition=sections[''欠席（加算なし）'']??{count:0,names:[],syncNames:[]};
            return {
              date,
              attendanceCount:attendance.count, attendanceNames:attendance.names, attendanceSyncNames:attendance.syncNames,
              absenceCount:absence.count, absenceNames:absence.names, absenceSyncNames:absence.syncNames,
              absenceWithoutAdditionCount:absenceWithoutAddition.count,
              absenceWithoutAdditionNames:absenceWithoutAddition.names,
              absenceWithoutAdditionSyncNames:absenceWithoutAddition.syncNames,
            };
          }).filter(Boolean);
          return { heading, days, facilityId:request.facilityId, year:Number(request.year), month:Number(request.month) };
        }
      `,
      args: [{ facilityId: input?.facilityId, targetDate: input?.targetDate, config }],
    });
    return result;
  };
',256),1);
INSERT INTO web_automation_flow_memos_v2 (flow_id,memo,sort_order,is_active) VALUES (@flow_id,'ProfessionalSupportWindowの月次同期で旧executeJavaScript直書き取得をV2へ移行。Laravel保存payloadの形式は変更しない。',10,1);
COMMIT;


-- ========================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
START TRANSACTION;
SET @app_key = CONVERT('hug-banso-navi' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @flow_key = CONVERT('professional_support_addition_count_fetch' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @flow_version = 1;
DELETE FROM web_automation_flows_v2 WHERE app_key COLLATE utf8mb4_unicode_ci=@app_key AND flow_key COLLATE utf8mb4_unicode_ci=@flow_key AND version=@flow_version;
INSERT INTO web_automation_flows_v2 (app_key,flow_key,name,description,entry_file,entry_export,engine_version,config_json,input_schema_json,output_schema_json,timeout_ms,version,status,published_at) VALUES (@app_key,@flow_key,'専門的支援 加算数取得','専門的支援月次同期用にHUG加算項目管理画面から専門的支援実施加算の月間件数を取得する。','index.js','default',1,'{"request":{"url":"https://www.hug-ayumu.link/hug/wm/adding_contents_children_2024.php"}}','{"type":"object","properties":{"facilityId":{"type":["string","number","null"]},"targetDate":{"type":["string","null"]}}}',NULL,60000,@flow_version,'published',NOW());
SET @flow_id=LAST_INSERT_ID();
INSERT INTO web_automation_files_v2 (flow_id,file_path,file_type,source_text,module_type,config_json,content_hash,is_active) VALUES (@flow_id,'index.js','javascript','const { fetchProfessionalSupportAdditionCount } = await require("./fetch");
module.exports = async function ({ input, helpers, config }) {
  return await fetchProfessionalSupportAdditionCount({ input, helpers, config });
};
','commonjs',NULL,SHA2('const { fetchProfessionalSupportAdditionCount } = await require("./fetch");
module.exports = async function ({ input, helpers, config }) {
  return await fetchProfessionalSupportAdditionCount({ input, helpers, config });
};
',256),1);
INSERT INTO web_automation_files_v2 (flow_id,file_path,file_type,source_text,module_type,config_json,content_hash,is_active) VALUES (@flow_id,'fetch.js','javascript','exports.fetchProfessionalSupportAdditionCount =
  async function ({ input, helpers, config }) {
    return await helpers.executeFunctionInWebview({
      functionText: `
        async function ({ facilityId, targetDate, config }) {
          const parts = String(targetDate ?? '''').split(''-'');
          const request = { url:config.request.url, facilityId:String(facilityId ?? ''''), year:String(Number(parts[0])||''''), month:String(Number(parts[1])||'''') };
          const readControlValue=(doc,name)=>String(doc.querySelector(''select[name="''+name+''"], input[name="''+name+''"]'')?.value ?? '''').trim();
          if (!request.facilityId || !request.year || !request.month) {
            const initialResponse=await fetch(request.url,{method:''GET'',credentials:''include'',cache:''no-store''});
            if(!initialResponse.ok) throw new Error(''加算項目管理画面の初期情報を取得できませんでした (HTTP ''+initialResponse.status+'')'');
            const initialDoc=new DOMParser().parseFromString(await initialResponse.text(),''text/html'');
            if(!request.facilityId) request.facilityId=readControlValue(initialDoc,''f_id'');
            if(!request.year) request.year=readControlValue(initialDoc,''s_year'');
            if(!request.month) request.month=readControlValue(initialDoc,''s_month'');
          }
          if(!request.facilityId) throw new Error(''加算項目管理画面の施設IDを取得できませんでした。'');
          if(!request.year || !request.month) throw new Error(''加算項目管理画面の対象年月を取得できませんでした。'');
          const body=new URLSearchParams({mode:''search'',f_id:request.facilityId,s_year:request.year,s_month:request.month,c_id:''0''});
          const response=await fetch(request.url,{method:''POST'',credentials:''include'',cache:''no-store'',headers:{''Content-Type'':''application/x-www-form-urlencoded;charset=UTF-8''},body:body.toString()});
          if(!response.ok) throw new Error(''加算数データの取得に失敗しました (HTTP ''+response.status+'')'');
          const doc=new DOMParser().parseFromString(await response.text(),''text/html'');
          const calendar=doc.querySelector(''.calendar'');
          if(!calendar){const title=doc.querySelector(''title'')?.textContent?.trim()??'''';throw new Error(title?''加算カレンダーを取得できませんでした。HUGのログイン状態を確認してください。 (''+title+'')'':''加算カレンダーを取得できませんでした。HUGのログイン状態を確認してください。'');}
          const heading=doc.querySelector(''.ibox-title h3'')?.textContent?.replace(/\\\\s+/g,'' '').trim()??'''';
          const days=Array.from(calendar.querySelectorAll(''td[id^="td_"]'')).map(cell=>{
            const date=cell.id.replace(/^td_/,''''); if(!/^\\\\d{4}-\\\\d{2}-\\\\d{2}$/.test(date)) return null;
            const additions=[];
            Array.from(cell.querySelectorAll(''ul.adding-calendar-list > li'')).forEach(item=>{
              const childList=item.querySelector('':scope > ul''); let name='''';
              for(const node of item.childNodes){if(node===childList)break;if(node.nodeType===Node.TEXT_NODE)name+='' ''+node.textContent;}
              name=name.replace(/\\\\s+/g,'' '').trim(); if(!name)return;
              const children=Array.from(childList?.querySelectorAll('':scope > li'')??[]).map(c=>c.textContent.replace(/\\\\s+/g,'' '').trim()).filter(Boolean);
              additions.push({name,count:children.length,children});
            });
            const professionalSupport=additions.find(a=>a.name===''専門的支援実施加算'');
            return {date,professionalSupportCount:professionalSupport?.count??0,professionalSupportChildren:professionalSupport?.children??[],additions};
          }).filter(Boolean);
          return {heading,facilityId:request.facilityId,year:Number(request.year),month:Number(request.month),days};
        }
      `,
      args:[{ facilityId:input?.facilityId, targetDate:input?.targetDate, config }],
    });
  };
','commonjs',NULL,SHA2('exports.fetchProfessionalSupportAdditionCount =
  async function ({ input, helpers, config }) {
    return await helpers.executeFunctionInWebview({
      functionText: `
        async function ({ facilityId, targetDate, config }) {
          const parts = String(targetDate ?? '''').split(''-'');
          const request = { url:config.request.url, facilityId:String(facilityId ?? ''''), year:String(Number(parts[0])||''''), month:String(Number(parts[1])||'''') };
          const readControlValue=(doc,name)=>String(doc.querySelector(''select[name="''+name+''"], input[name="''+name+''"]'')?.value ?? '''').trim();
          if (!request.facilityId || !request.year || !request.month) {
            const initialResponse=await fetch(request.url,{method:''GET'',credentials:''include'',cache:''no-store''});
            if(!initialResponse.ok) throw new Error(''加算項目管理画面の初期情報を取得できませんでした (HTTP ''+initialResponse.status+'')'');
            const initialDoc=new DOMParser().parseFromString(await initialResponse.text(),''text/html'');
            if(!request.facilityId) request.facilityId=readControlValue(initialDoc,''f_id'');
            if(!request.year) request.year=readControlValue(initialDoc,''s_year'');
            if(!request.month) request.month=readControlValue(initialDoc,''s_month'');
          }
          if(!request.facilityId) throw new Error(''加算項目管理画面の施設IDを取得できませんでした。'');
          if(!request.year || !request.month) throw new Error(''加算項目管理画面の対象年月を取得できませんでした。'');
          const body=new URLSearchParams({mode:''search'',f_id:request.facilityId,s_year:request.year,s_month:request.month,c_id:''0''});
          const response=await fetch(request.url,{method:''POST'',credentials:''include'',cache:''no-store'',headers:{''Content-Type'':''application/x-www-form-urlencoded;charset=UTF-8''},body:body.toString()});
          if(!response.ok) throw new Error(''加算数データの取得に失敗しました (HTTP ''+response.status+'')'');
          const doc=new DOMParser().parseFromString(await response.text(),''text/html'');
          const calendar=doc.querySelector(''.calendar'');
          if(!calendar){const title=doc.querySelector(''title'')?.textContent?.trim()??'''';throw new Error(title?''加算カレンダーを取得できませんでした。HUGのログイン状態を確認してください。 (''+title+'')'':''加算カレンダーを取得できませんでした。HUGのログイン状態を確認してください。'');}
          const heading=doc.querySelector(''.ibox-title h3'')?.textContent?.replace(/\\\\s+/g,'' '').trim()??'''';
          const days=Array.from(calendar.querySelectorAll(''td[id^="td_"]'')).map(cell=>{
            const date=cell.id.replace(/^td_/,''''); if(!/^\\\\d{4}-\\\\d{2}-\\\\d{2}$/.test(date)) return null;
            const additions=[];
            Array.from(cell.querySelectorAll(''ul.adding-calendar-list > li'')).forEach(item=>{
              const childList=item.querySelector('':scope > ul''); let name='''';
              for(const node of item.childNodes){if(node===childList)break;if(node.nodeType===Node.TEXT_NODE)name+='' ''+node.textContent;}
              name=name.replace(/\\\\s+/g,'' '').trim(); if(!name)return;
              const children=Array.from(childList?.querySelectorAll('':scope > li'')??[]).map(c=>c.textContent.replace(/\\\\s+/g,'' '').trim()).filter(Boolean);
              additions.push({name,count:children.length,children});
            });
            const professionalSupport=additions.find(a=>a.name===''専門的支援実施加算'');
            return {date,professionalSupportCount:professionalSupport?.count??0,professionalSupportChildren:professionalSupport?.children??[],additions};
          }).filter(Boolean);
          return {heading,facilityId:request.facilityId,year:Number(request.year),month:Number(request.month),days};
        }
      `,
      args:[{ facilityId:input?.facilityId, targetDate:input?.targetDate, config }],
    });
  };
',256),1);
INSERT INTO web_automation_flow_memos_v2 (flow_id,memo,sort_order,is_active) VALUES (@flow_id,'ProfessionalSupportWindowの月次同期で旧executeJavaScript直書き取得をV2へ移行。Laravel保存payloadの形式は変更しない。',10,1);
COMMIT;


-- ========================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
START TRANSACTION;
SET @app_key = CONVERT('hug-banso-navi' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @flow_key = CONVERT('professional_support_record_list_fetch' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @flow_version = 1;
DELETE FROM web_automation_flows_v2 WHERE app_key COLLATE utf8mb4_unicode_ci=@app_key AND flow_key COLLATE utf8mb4_unicode_ci=@flow_key AND version=@flow_version;
INSERT INTO web_automation_flows_v2 (app_key,flow_key,name,description,entry_file,entry_export,engine_version,config_json,input_schema_json,output_schema_json,timeout_ms,version,status,published_at) VALUES (@app_key,@flow_key,'専門的支援 一覧取得','専門的支援月次同期用にHUG各種加算・議事録管理から専門的支援実施加算(ID=55)一覧を取得する。','index.js','default',1,'{"request":{"url":"https://www.hug-ayumu.link/hug/wm/record_proceedings.php"},"professionalSupportId":"55"}','{"type":"object","properties":{"facilityId":{"type":["string","number","null"]},"targetDate":{"type":["string","null"]}}}',NULL,60000,@flow_version,'published',NOW());
SET @flow_id=LAST_INSERT_ID();
INSERT INTO web_automation_files_v2 (flow_id,file_path,file_type,source_text,module_type,config_json,content_hash,is_active) VALUES (@flow_id,'index.js','javascript','const { fetchProfessionalSupportRecordList } = await require("./fetch");
module.exports = async function ({ input, helpers, config }) {
  return await fetchProfessionalSupportRecordList({ input, helpers, config });
};
','commonjs',NULL,SHA2('const { fetchProfessionalSupportRecordList } = await require("./fetch");
module.exports = async function ({ input, helpers, config }) {
  return await fetchProfessionalSupportRecordList({ input, helpers, config });
};
',256),1);
INSERT INTO web_automation_files_v2 (flow_id,file_path,file_type,source_text,module_type,config_json,content_hash,is_active) VALUES (@flow_id,'fetch.js','javascript','exports.fetchProfessionalSupportRecordList =
  async function ({ input, helpers, config }) {
    return await helpers.executeFunctionInWebview({
      functionText: `
        async function ({ facilityId, targetDate, config }) {
          const normalizeText=v=>String(v??'''').replace(/\\\\s+/g,'' '').trim();
          const parts=String(targetDate??'''').split(''-'');
          const request={url:config.request.url,facilityId:String(facilityId??''''),year:String(Number(parts[0])||''''),month:String(Number(parts[1])||'''')};
          const toJapaneseDate=(y,m,d)=>String(y)+''年''+String(m).padStart(2,''0'')+''月''+String(d).padStart(2,''0'')+''日'';
          const getMonthLastDay=(y,m)=>new Date(Number(y),Number(m),0).getDate();
          const parseRows=(doc)=>{
            const table=Array.from(doc.querySelectorAll(''table.table'')).find(candidate=>{const h=Array.from(candidate.querySelectorAll(''thead th'')).map(th=>normalizeText(th.textContent));return h.includes(''児童名'')&&h.includes(''加算名／タイトル'')&&h.includes(''実施日'');});
            if(!table)return[];
            return Array.from(table.querySelectorAll(''tbody > tr'')).map(row=>{
              const cells=Array.from(row.querySelectorAll('':scope > td''));
              const detailOnClick=cells[0]?.querySelector(''button'')?.getAttribute(''onclick'')??'''';
              const idMatch=detailOnClick.match(/[?&]id=(\\\\d+)/);
              const signed=Boolean(cells[8]?.querySelector(''img[src*="sign-icon"], img'')||normalizeText(cells[8]?.textContent));
              return {id:idMatch?.[1]??'''',childName:normalizeText(cells[1]?.textContent),additionName:normalizeText(cells[2]?.textContent),facilityName:normalizeText(cells[3]?.textContent),serviceName:normalizeText(cells[4]?.textContent),recorderName:normalizeText(cells[5]?.textContent),interviewDate:normalizeText(cells[6]?.textContent),status:normalizeText(cells[7]?.textContent),signed,lastUpdated:normalizeText(cells[9]?.textContent)};
            }).filter(item=>item.id||item.childName||item.interviewDate);
          };
          const initialResponse=await fetch(request.url,{method:''GET'',credentials:''include'',cache:''no-store''});
          if(!initialResponse.ok) throw new Error(''各種加算・議事録管理画面を取得できませんでした (HTTP ''+initialResponse.status+'')'');
          const initialDoc=new DOMParser().parseFromString(await initialResponse.text(),''text/html'');
          const csrfToken=String(initialDoc.querySelector(''input[name="csrf_token_from_client"]'')?.value??'''').trim();
          const modeToken=String(initialDoc.querySelector(''input[name="mode_token"]'')?.value??''nomode'').trim()||''nomode'';
          if(!csrfToken) throw new Error(''各種加算・議事録管理画面のCSRFトークンを取得できませんでした。HUGのログイン状態を確認してください。'');
          if(!request.facilityId){const checked=initialDoc.querySelector(''input[name^="f_ary["]:checked, input[name^="f_ary["]'');request.facilityId=String(checked?.value??'''').trim();}
          if(!request.facilityId) throw new Error(''一覧取得対象の施設IDを取得できませんでした。'');
          if(!request.year||!request.month){const startDate=String(initialDoc.querySelector(''input[name="interview_date"]'')?.value??'''');const m=startDate.match(/(\\\\d{4})年(\\\\d{1,2})月/);if(m){request.year=m[1];request.month=m[2];}}
          if(!request.year||!request.month) throw new Error(''一覧取得対象の年月を取得できませんでした。'');
          const lastDay=getMonthLastDay(request.year,request.month), startDate=toJapaneseDate(request.year,request.month,1), endDate=toJapaneseDate(request.year,request.month,lastDay);
          const body=new URLSearchParams();body.set(''mode'',''search'');body.set(''mode_token'',modeToken);body.set(''csrf_token_from_client'',csrfToken);body.set(''f_ary[''+request.facilityId+'']'',request.facilityId);body.set(''c_id'',''0'');body.set(''search'','''');body.set(''interview_date'',startDate);body.set(''interview_date_end'',endDate);body.set(''s_ary[1]'',''放課後等デイサービス'');body.set(''s_ary[2]'',''児童発達支援'');body.set(''adding_children_id'',''55'');body.set(''recorder'','''');
          const response=await fetch(request.url,{method:''POST'',credentials:''include'',cache:''no-store'',headers:{''Content-Type'':''application/x-www-form-urlencoded;charset=UTF-8''},body:body.toString()});
          if(!response.ok) throw new Error(''専門的支援一覧の取得に失敗しました (HTTP ''+response.status+'')'');
          const doc=new DOMParser().parseFromString(await response.text(),''text/html'');
          const firstPageRows=parseRows(doc);
          const totalText=normalizeText(Array.from(doc.querySelectorAll(''.ibox-title.sm h5, .ibox-title h5'')).map(n=>n.textContent).find(t=>/全部で\\\\d+件/.test(t))??'''');
          const totalMatch=totalText.match(/全部で(\\\\d+)件/); const total=totalMatch?Number(totalMatch[1]):firstPageRows.length;
          const pageNumbers=Array.from(doc.querySelectorAll(''.pagination a'')).map(a=>{const m=(a.getAttribute(''href'')??'''').match(/[?&]page=(\\\\d+)/);return m?Number(m[1]):null;}).filter(Number.isFinite);
          const maxPage=Math.max(1,...pageNumbers); const records=[...firstPageRows];
          for(let page=2;page<=maxPage;page+=1){const pageResponse=await fetch(request.url+''?page=''+page,{method:''GET'',credentials:''include'',cache:''no-store''});if(!pageResponse.ok)throw new Error(''専門的支援一覧の''+page+''ページ目を取得できませんでした (HTTP ''+pageResponse.status+'')'');const pageDoc=new DOMParser().parseFromString(await pageResponse.text(),''text/html'');records.push(...parseRows(pageDoc));}
          const uniqueRecords=Array.from(new Map(records.map((record,index)=>[record.id?''id:''+record.id:[''fallback'',record.childName,record.interviewDate,record.facilityName,record.recorderName,record.lastUpdated,index].join(''|''),record])).values());
          return {facilityId:request.facilityId,year:Number(request.year),month:Number(request.month),startDate,endDate,total:Math.min(total,uniqueRecords.length),pageCount:maxPage,records:uniqueRecords};
        }
      `,
      args:[{ facilityId:input?.facilityId, targetDate:input?.targetDate, config }],
    });
  };
','commonjs',NULL,SHA2('exports.fetchProfessionalSupportRecordList =
  async function ({ input, helpers, config }) {
    return await helpers.executeFunctionInWebview({
      functionText: `
        async function ({ facilityId, targetDate, config }) {
          const normalizeText=v=>String(v??'''').replace(/\\\\s+/g,'' '').trim();
          const parts=String(targetDate??'''').split(''-'');
          const request={url:config.request.url,facilityId:String(facilityId??''''),year:String(Number(parts[0])||''''),month:String(Number(parts[1])||'''')};
          const toJapaneseDate=(y,m,d)=>String(y)+''年''+String(m).padStart(2,''0'')+''月''+String(d).padStart(2,''0'')+''日'';
          const getMonthLastDay=(y,m)=>new Date(Number(y),Number(m),0).getDate();
          const parseRows=(doc)=>{
            const table=Array.from(doc.querySelectorAll(''table.table'')).find(candidate=>{const h=Array.from(candidate.querySelectorAll(''thead th'')).map(th=>normalizeText(th.textContent));return h.includes(''児童名'')&&h.includes(''加算名／タイトル'')&&h.includes(''実施日'');});
            if(!table)return[];
            return Array.from(table.querySelectorAll(''tbody > tr'')).map(row=>{
              const cells=Array.from(row.querySelectorAll('':scope > td''));
              const detailOnClick=cells[0]?.querySelector(''button'')?.getAttribute(''onclick'')??'''';
              const idMatch=detailOnClick.match(/[?&]id=(\\\\d+)/);
              const signed=Boolean(cells[8]?.querySelector(''img[src*="sign-icon"], img'')||normalizeText(cells[8]?.textContent));
              return {id:idMatch?.[1]??'''',childName:normalizeText(cells[1]?.textContent),additionName:normalizeText(cells[2]?.textContent),facilityName:normalizeText(cells[3]?.textContent),serviceName:normalizeText(cells[4]?.textContent),recorderName:normalizeText(cells[5]?.textContent),interviewDate:normalizeText(cells[6]?.textContent),status:normalizeText(cells[7]?.textContent),signed,lastUpdated:normalizeText(cells[9]?.textContent)};
            }).filter(item=>item.id||item.childName||item.interviewDate);
          };
          const initialResponse=await fetch(request.url,{method:''GET'',credentials:''include'',cache:''no-store''});
          if(!initialResponse.ok) throw new Error(''各種加算・議事録管理画面を取得できませんでした (HTTP ''+initialResponse.status+'')'');
          const initialDoc=new DOMParser().parseFromString(await initialResponse.text(),''text/html'');
          const csrfToken=String(initialDoc.querySelector(''input[name="csrf_token_from_client"]'')?.value??'''').trim();
          const modeToken=String(initialDoc.querySelector(''input[name="mode_token"]'')?.value??''nomode'').trim()||''nomode'';
          if(!csrfToken) throw new Error(''各種加算・議事録管理画面のCSRFトークンを取得できませんでした。HUGのログイン状態を確認してください。'');
          if(!request.facilityId){const checked=initialDoc.querySelector(''input[name^="f_ary["]:checked, input[name^="f_ary["]'');request.facilityId=String(checked?.value??'''').trim();}
          if(!request.facilityId) throw new Error(''一覧取得対象の施設IDを取得できませんでした。'');
          if(!request.year||!request.month){const startDate=String(initialDoc.querySelector(''input[name="interview_date"]'')?.value??'''');const m=startDate.match(/(\\\\d{4})年(\\\\d{1,2})月/);if(m){request.year=m[1];request.month=m[2];}}
          if(!request.year||!request.month) throw new Error(''一覧取得対象の年月を取得できませんでした。'');
          const lastDay=getMonthLastDay(request.year,request.month), startDate=toJapaneseDate(request.year,request.month,1), endDate=toJapaneseDate(request.year,request.month,lastDay);
          const body=new URLSearchParams();body.set(''mode'',''search'');body.set(''mode_token'',modeToken);body.set(''csrf_token_from_client'',csrfToken);body.set(''f_ary[''+request.facilityId+'']'',request.facilityId);body.set(''c_id'',''0'');body.set(''search'','''');body.set(''interview_date'',startDate);body.set(''interview_date_end'',endDate);body.set(''s_ary[1]'',''放課後等デイサービス'');body.set(''s_ary[2]'',''児童発達支援'');body.set(''adding_children_id'',''55'');body.set(''recorder'','''');
          const response=await fetch(request.url,{method:''POST'',credentials:''include'',cache:''no-store'',headers:{''Content-Type'':''application/x-www-form-urlencoded;charset=UTF-8''},body:body.toString()});
          if(!response.ok) throw new Error(''専門的支援一覧の取得に失敗しました (HTTP ''+response.status+'')'');
          const doc=new DOMParser().parseFromString(await response.text(),''text/html'');
          const firstPageRows=parseRows(doc);
          const totalText=normalizeText(Array.from(doc.querySelectorAll(''.ibox-title.sm h5, .ibox-title h5'')).map(n=>n.textContent).find(t=>/全部で\\\\d+件/.test(t))??'''');
          const totalMatch=totalText.match(/全部で(\\\\d+)件/); const total=totalMatch?Number(totalMatch[1]):firstPageRows.length;
          const pageNumbers=Array.from(doc.querySelectorAll(''.pagination a'')).map(a=>{const m=(a.getAttribute(''href'')??'''').match(/[?&]page=(\\\\d+)/);return m?Number(m[1]):null;}).filter(Number.isFinite);
          const maxPage=Math.max(1,...pageNumbers); const records=[...firstPageRows];
          for(let page=2;page<=maxPage;page+=1){const pageResponse=await fetch(request.url+''?page=''+page,{method:''GET'',credentials:''include'',cache:''no-store''});if(!pageResponse.ok)throw new Error(''専門的支援一覧の''+page+''ページ目を取得できませんでした (HTTP ''+pageResponse.status+'')'');const pageDoc=new DOMParser().parseFromString(await pageResponse.text(),''text/html'');records.push(...parseRows(pageDoc));}
          const uniqueRecords=Array.from(new Map(records.map((record,index)=>[record.id?''id:''+record.id:[''fallback'',record.childName,record.interviewDate,record.facilityName,record.recorderName,record.lastUpdated,index].join(''|''),record])).values());
          return {facilityId:request.facilityId,year:Number(request.year),month:Number(request.month),startDate,endDate,total:Math.min(total,uniqueRecords.length),pageCount:maxPage,records:uniqueRecords};
        }
      `,
      args:[{ facilityId:input?.facilityId, targetDate:input?.targetDate, config }],
    });
  };
',256),1);
INSERT INTO web_automation_flow_memos_v2 (flow_id,memo,sort_order,is_active) VALUES (@flow_id,'ProfessionalSupportWindowの月次同期で旧executeJavaScript直書き取得をV2へ移行。Laravel保存payloadの形式は変更しない。',10,1);
COMMIT;
