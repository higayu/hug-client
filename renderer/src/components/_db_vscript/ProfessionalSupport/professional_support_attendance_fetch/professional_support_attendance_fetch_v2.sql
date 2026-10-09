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
