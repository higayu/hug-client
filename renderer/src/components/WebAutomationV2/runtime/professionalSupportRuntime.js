import { executeInWebview } from "../executors/webview.js";

function unwrapHtml(value) {
  if (typeof value === "string") return value;
  return value?.html || value?.pageHtml || value?.value || "";
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function parseMonthlyAttendance({ config, context }) {
  const sourceKey = config.sourceKey || config.inputKey || "attendanceHtml";
  const html = unwrapHtml(context[sourceKey]);
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
  const calendar = doc.querySelector(config.calendarSelector || ".calendar");
  if (!calendar) throw new Error("出席カレンダーを取得できませんでした。HUGのログイン状態を確認してください。");

  const days = Array.from(calendar.querySelectorAll('td[id^="td_"]'))
    .map((cell) => {
      const date = cell.id.replace(/^td_/, "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

      const sections = Array.from(cell.querySelectorAll(".calendar-data dt")).reduce((result, titleElement) => {
        const type = titleElement.querySelector("span")?.textContent?.trim() ?? "";
        const childItems = Array.from(titleElement.nextElementSibling?.querySelectorAll("li") ?? []);
        const names = childItems.map((item) => normalizeText(item.textContent)).filter(Boolean);
        const syncNames = childItems
          .filter((item) => !item.querySelector(".calendar-pickup"))
          .map((item) => normalizeText(item.textContent))
          .filter(Boolean);
        const countText = titleElement.querySelector("b")?.textContent?.trim();
        result[type] = { count: countText ? Number(countText) : names.length, names, syncNames };
        return result;
      }, {});

      const attendance = sections["出席"] ?? { count: 0, names: [], syncNames: [] };
      const absence = sections["欠席"] ?? { count: 0, names: [], syncNames: [] };
      const absenceWithoutAddition = sections["欠席（加算なし）"] ?? { count: 0, names: [], syncNames: [] };

      return {
        date,
        attendanceCount: attendance.count,
        attendanceNames: attendance.names,
        attendanceSyncNames: attendance.syncNames,
        absenceCount: absence.count,
        absenceNames: absence.names,
        absenceSyncNames: absence.syncNames,
        absenceWithoutAdditionCount: absenceWithoutAddition.count,
        absenceWithoutAdditionNames: absenceWithoutAddition.names,
        absenceWithoutAdditionSyncNames: absenceWithoutAddition.syncNames,
      };
    })
    .filter(Boolean);

  return {
    heading: doc.querySelector(".ibox-title h3")?.textContent?.trim() ?? "",
    days,
    facilityId: String(context.facilityId ?? ""),
    year: Number(context.year),
    month: Number(context.month),
  };
}

function parseMonthlyAdditionCount({ config, context }) {
  const sourceKey = config.sourceKey || config.inputKey || "additionCountHtml";
  const html = unwrapHtml(context[sourceKey]);
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
  const calendar = doc.querySelector(config.calendarSelector || ".calendar");
  if (!calendar) throw new Error("加算カレンダーを取得できませんでした。HUGのログイン状態を確認してください。");

  const days = Array.from(calendar.querySelectorAll('td[id^="td_"]'))
    .map((cell) => {
      const date = cell.id.replace(/^td_/, "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

      const additions = [];
      Array.from(cell.querySelectorAll("ul.adding-calendar-list > li")).forEach((item) => {
        const childList = item.querySelector(":scope > ul");
        let name = "";
        for (const node of item.childNodes) {
          if (node === childList) break;
          if (node.nodeType === Node.TEXT_NODE) name += ` ${node.textContent}`;
        }
        name = normalizeText(name);
        if (!name) return;
        const children = Array.from(childList?.querySelectorAll(":scope > li") ?? [])
          .map((child) => normalizeText(child.textContent))
          .filter(Boolean);
        additions.push({ name, count: children.length, children });
      });

      const targetAdditionName = config.targetAdditionName || "専門的支援実施加算";
      const professionalSupport = additions.find((addition) => addition.name === targetAdditionName);
      return {
        date,
        professionalSupportCount: professionalSupport?.count ?? 0,
        professionalSupportChildren: professionalSupport?.children ?? [],
        additions,
      };
    })
    .filter(Boolean);

  return {
    heading: normalizeText(doc.querySelector(".ibox-title h3")?.textContent),
    facilityId: String(context.facilityId ?? ""),
    year: Number(context.year),
    month: Number(context.month),
    days,
  };
}

async function extractProfessionalSupportList({ config, context, runtime }) {
  const webview = await runtime.resolveWebview(config.webviewKey);
  const url = String(config.url || "");
  if (!url) throw new Error("professional-support-addition-list: urlがありません");

  const payload = {
    url,
    facilityId: String(context.facilityId ?? ""),
    year: Number(context.year),
    month: Number(context.month),
    additionId: String(config.additionId || "55"),
    service1: config.service1 || "放課後等デイサービス",
    service2: config.service2 || "児童発達支援",
  };

  const result = await executeInWebview(webview, `
    (async () => {
      const p = ${JSON.stringify(payload)};
      const normalizeText = (v) => String(v ?? '').replace(/\\s+/g, ' ').trim();
      const jpDate = (y,m,d) => String(y)+'年'+String(m).padStart(2,'0')+'月'+String(d).padStart(2,'0')+'日';
      const lastDay = new Date(Number(p.year), Number(p.month), 0).getDate();
      const parseRows = (doc) => {
        const table = Array.from(doc.querySelectorAll('table.table')).find((t) => {
          const h = Array.from(t.querySelectorAll('thead th')).map((x) => normalizeText(x.textContent));
          return h.includes('児童名') && h.includes('加算名／タイトル') && h.includes('実施日');
        });
        if (!table) return [];
        return Array.from(table.querySelectorAll('tbody > tr')).map((row) => {
          const c = Array.from(row.querySelectorAll(':scope > td'));
          const onclick = c[0]?.querySelector('button')?.getAttribute('onclick') ?? '';
          const id = onclick.match(/[?&]id=(\\d+)/)?.[1] ?? '';
          return {
            id,
            childName: normalizeText(c[1]?.textContent),
            additionName: normalizeText(c[2]?.textContent),
            facilityName: normalizeText(c[3]?.textContent),
            serviceName: normalizeText(c[4]?.textContent),
            recorderName: normalizeText(c[5]?.textContent),
            interviewDate: normalizeText(c[6]?.textContent),
            status: normalizeText(c[7]?.textContent),
            signed: Boolean(c[8]?.querySelector('img') || normalizeText(c[8]?.textContent)),
            lastUpdated: normalizeText(c[9]?.textContent),
          };
        }).filter((x) => x.id || x.childName || x.interviewDate);
      };
      const parseTotal = (doc) => {
        const text = normalizeText(Array.from(doc.querySelectorAll('.ibox-title.sm h5, .ibox-title h5')).map((n) => n.textContent).find((x) => /全部で\\d+件/.test(x)) ?? '');
        const m = text.match(/全部で(\\d+)件/);
        return m ? Number(m[1]) : null;
      };
      const parseMaxPage = (doc) => Math.max(1, ...Array.from(doc.querySelectorAll('.pagination a')).map((a) => a.getAttribute('href')?.match(/[?&]page=(\\d+)/)?.[1]).filter(Boolean).map(Number));

      const initial = await fetch(p.url, { method:'GET', credentials:'include', cache:'no-store' });
      if (!initial.ok) throw new Error('各種加算・議事録管理画面を取得できませんでした (HTTP '+initial.status+')');
      const initialDoc = new DOMParser().parseFromString(await initial.text(), 'text/html');
      const csrf = String(initialDoc.querySelector('input[name="csrf_token_from_client"]')?.value ?? '').trim();
      const modeToken = String(initialDoc.querySelector('input[name="mode_token"]')?.value ?? 'nomode').trim() || 'nomode';
      if (!csrf) throw new Error('各種加算・議事録管理画面のCSRFトークンを取得できませんでした。');

      const startDate = jpDate(p.year, p.month, 1);
      const endDate = jpDate(p.year, p.month, lastDay);
      const body = new URLSearchParams();
      body.set('mode','search'); body.set('mode_token',modeToken); body.set('csrf_token_from_client',csrf);
      body.set('f_ary['+p.facilityId+']',p.facilityId); body.set('c_id','0'); body.set('search','');
      body.set('interview_date',startDate); body.set('interview_date_end',endDate);
      body.set('s_ary[1]',p.service1); body.set('s_ary[2]',p.service2); body.set('adding_children_id',p.additionId); body.set('recorder','');

      const search = await fetch(p.url, { method:'POST', credentials:'include', cache:'no-store', headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body:body.toString() });
      if (!search.ok) throw new Error('専門的支援一覧の検索に失敗しました (HTTP '+search.status+')');
      const searchDoc = new DOMParser().parseFromString(await search.text(), 'text/html');
      const total = parseTotal(searchDoc);
      const maxPage = parseMaxPage(searchDoc);
      const records = []; const pageResults = [];
      for (let page=1; page<=maxPage; page+=1) {
        const r = await fetch(p.url+'?page='+page, { method:'GET', credentials:'include', cache:'no-store' });
        if (!r.ok) throw new Error('専門的支援一覧の'+page+'ページ目を取得できませんでした (HTTP '+r.status+')');
        const rows = parseRows(new DOMParser().parseFromString(await r.text(), 'text/html'));
        pageResults.push({page,count:rows.length}); records.push(...rows);
      }
      const unique = Array.from(new Map(records.map((record,index) => [record.id ? 'id:'+record.id : ['fallback',record.childName,record.interviewDate,record.facilityName,record.recorderName,record.lastUpdated,index].join('|'), record])).values());
      if (Number.isFinite(total) && total !== unique.length) throw new Error('専門的支援一覧の取得件数が一致しません。 HUG='+total+'件 / 取得='+unique.length+'件');
      return { success:true, facilityId:p.facilityId, year:Number(p.year), month:Number(p.month), startDate, endDate, total:Number.isFinite(total)?total:unique.length, fetchedCount:unique.length, rawCount:records.length, pageCount:maxPage, pageResults, records:unique };
    })()
  `);

  if (!result?.success) throw new Error(result?.error || "専門的支援一覧の取得に失敗しました");
  return result;
}

export function createProfessionalSupportRuntime({ webviewRef } = {}) {
  return {
    appKey: "hug-banso-navi",
    engineVersion: 1,
    resolveWebview: async () => {
      const webview = webviewRef?.current || webviewRef;
      if (!webview) throw new Error("HUGセッション確認用WebViewを取得できません。");
      return webview;
    },
    parsers: {
      "professional-support-month-attendance": parseMonthlyAttendance,
      "professional-support-month-addition-count": parseMonthlyAdditionCount,
    },
    extractors: {
      "professional-support-addition-list": extractProfessionalSupportList,
    },
  };
}
