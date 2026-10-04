import { getHugWebviewForCache } from '@/hooks/useHugCache/getHugCache.js'

export const WEB_AUTOMATION_SCOPE = {
  app_key: 'hug-banso-navi',
  webview_key: '*',
}

function parseMaybeJson(value, fallback = {}) {
  if (value == null || value === '') return fallback
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return fallback

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function collectObjects(value, list = []) {
  if (!value || typeof value !== 'object') return list

  if (!Array.isArray(value)) {
    list.push(value)
  }

  Object.values(value).forEach((child) => {
    if (child && typeof child === 'object') {
      collectObjects(child, list)
    }
  })

  return list
}

function unwrapFlowResponse(response) {
  if (response?.data?.data) return response.data.data
  if (response?.data) return response.data
  return response
}

function getRuleFromFlowResponse(response, expectedRuleKey = '') {
  const flowData = unwrapFlowResponse(response)
  const objects = collectObjects(flowData)

  const expected = String(expectedRuleKey || '').trim()

  if (expected) {
    const matched = objects.find((item) => {
      return String(item?.rule_key || item?.key || '') === expected
    })

    if (matched) return matched
  }

  const withRuleConfig = objects.find((item) => {
    return item?.config_json != null &&
      (
        item?.rule_key ||
        item?.action_type ||
        item?.function_name ||
        item?.parser_type ||
        item?.target_selector
      )
  })

  if (withRuleConfig) return withRuleConfig

  const stepRule = objects.find((item) => item?.rule?.config_json)
  if (stepRule?.rule) return stepRule.rule

  return null
}

async function loadWebAutomationRuleConfig({
  flowKey,
  expectedRuleKey = '',
}) {
  if (!window.electronAPI?.laravel_webAutomationFlow_get) {
    throw new Error('laravel_webAutomationFlow_get が使用できません')
  }

  const response = await window.electronAPI.laravel_webAutomationFlow_get(
    flowKey,
    WEB_AUTOMATION_SCOPE,
  )

  const rule = getRuleFromFlowResponse(response, expectedRuleKey)
  const config = parseMaybeJson(rule?.config_json, null)

  if (!rule || !config) {
    throw new Error(`web_automation_flows からRule設定を取得できません: ${flowKey}`)
  }

  return {
    response,
    rule,
    config,
  }
}

function template(value, context) {
  if (typeof value !== 'string') return value

  return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key) => {
    const name = String(key || '').trim()
    const resolved = context[name]
    return resolved == null ? '' : String(resolved)
  })
}

function toJapaneseDate(ymd) {
  const m = String(ymd || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return String(ymd || '')
  return `${m[1]}年${String(m[2]).padStart(2, '0')}月${String(m[3]).padStart(2, '0')}日`
}

function splitTime(time) {
  const m = String(time || '').match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return { hour: '', minute: '' }
  return { hour: String(Number(m[1])), minute: String(m[2]) }
}

function resolveWaf(value) {
  let note = String(value ?? '')
  const words = ['and', 'or', 'where', 'left', 'join', '(', ')', 'like']

  for (const word of words) {
    const escaped = Array.from(String(word))
      .map((ch) => '^$.*+?()[]{}|'.includes(ch) ? `\\${ch}` : ch)
      .join('')
    const re = new RegExp(escaped, 'ig')
    const matches = note.match(re)
    if (!matches) continue

    for (const matched of matches) {
      note = note.replace(matched + ' ', '*-_-*' + matched + '*-_-* ')
      note = note.replace(' ' + matched, ' *-_-*' + matched + '*-_-*')
      note = note.replace(matched + '　', '*-_-*' + matched + '*-_-*　')
      note = note.replace('　' + matched, '　*-_-*' + matched + '*-_-*')
      note = note.replace(/"/g, 'カンマ')
      note = note.replace(/”/g, 'ゼカンマ')
      note = note.replace(/\(/g, 'カッコマエ')
      note = note.replace(/\)/g, 'カッコアト')
      note = note.replace(/（/g, 'ゼカッコマエ')
      note = note.replace(/）/g, 'ゼカッコアト')
    }
  }

  return note
}

async function getHugWebviewOrThrow() {
  const webview = await getHugWebviewForCache()
  if (!webview) throw new Error('HUG の WebView が見つかりません')
  return webview
}

export async function executeProfessionalSupportDraftPostInWebview(
  webview,
  payload,
) {
  const { config } = await loadWebAutomationRuleConfig({
    flowKey: 'professional_support_draft_save',
    expectedRuleKey: 'professional_support_draft_post',
  })

  const script = `
    (async () => {
      const CONFIG = ${JSON.stringify(config)};
      const PAYLOAD = ${JSON.stringify(payload)};

      const template = (value, context) => {
        if (typeof value !== 'string') return value;
        return value.replace(/\\{\\{\\s*([^}]+?)\\s*\\}\\}/g, (_, key) => {
          const name = String(key || '').trim();
          const resolved = context[name];
          return resolved == null ? '' : String(resolved);
        });
      };

      const toJapaneseDate = ${toJapaneseDate.toString()};
      const splitTime = ${splitTime.toString()};
      const resolveWaf = ${resolveWaf.toString()};

      try {
        const requestConfig = CONFIG.request || {};
        const csrfConfig = CONFIG.csrf || {};
        const bodyConfig = CONFIG.body || {};

        const formUrl = requestConfig.form_url;
        const postUrl = requestConfig.post_url;

        if (!formUrl || !postUrl) {
          throw new Error('専門的支援POSTのURL設定が不足しています');
        }

        let csrf = '';

        if (csrfConfig.enabled !== false) {
          const formResponse = await fetch(formUrl, {
            method: csrfConfig.fetch_method || 'GET',
            credentials: requestConfig.credentials || 'include',
            cache: 'no-store',
          });

          if (!formResponse.ok) {
            throw new Error('登録フォーム取得失敗 (' + formResponse.status + ')');
          }

          const formHtml = await formResponse.text();
          const formDoc = new DOMParser().parseFromString(formHtml, 'text/html');
          csrf = formDoc.querySelector(csrfConfig.selector || '#csrf_token_from_client')?.value || '';

          if (!csrf) {
            throw new Error('CSRFトークンを取得できませんでした');
          }
        }

        const start = splitTime(PAYLOAD.startTime);
        const end = splitTime(PAYLOAD.endTime);

        const context = {
          ...PAYLOAD,
          csrf,
          interviewDate: toJapaneseDate(PAYLOAD.dateStr),
          startHour: start.hour,
          startMinute: start.minute,
          endHour: end.hour,
          endMinute: end.minute,
          safeTitle: resolveWaf(PAYLOAD.title || '記録'),
          safeContents: resolveWaf(PAYLOAD.contents || ''),
        };

        const body = new FormData();

        Object.entries(bodyConfig).forEach(([key, rawValue]) => {
          const resolvedKey = template(key, context);
          const resolvedValue = template(rawValue, context);

          if (resolvedKey === 'draft_flg') {
            body.append(resolvedKey, PAYLOAD.saveMode || resolvedValue || 'draft');
            return;
          }

          body.append(resolvedKey, resolvedValue);
        });

        const postResponse = await fetch(postUrl, {
          method: requestConfig.method || 'POST',
          body,
          credentials: requestConfig.credentials || 'include',
          redirect: requestConfig.redirect || 'follow',
        });

        const responseText = await postResponse.text();

        if (!postResponse.ok) {
          throw new Error(
            '専門的支援POST失敗 (' + postResponse.status + '): ' +
            responseText.slice(0, 300)
          );
        }

        const resultDoc = new DOMParser().parseFromString(responseText, 'text/html');
        const responseConfig = CONFIG.response || {};
        const errorSelectors = responseConfig.error_selectors || ['.js_data_err', 'p.err'];

        const errors = errorSelectors.flatMap((selector) => {
          return Array.from(resultDoc.querySelectorAll(selector))
            .map((el) => String(el.textContent || '').replace(/\\s+/g, ' ').trim())
            .filter(Boolean);
        });

        if (errors.length > 0) {
          throw new Error(errors.slice(0, 3).join(' / '));
        }

        const failureSelector = responseConfig.failure_selector || '#form_id';
        const formStillVisible = Boolean(resultDoc.querySelector(failureSelector));

        if (responseConfig.success_when_form_absent !== false && formStillVisible) {
          throw new Error('保存後も登録フォームが表示されました。入力内容を確認してください');
        }

        return {
          ok: true,
          saved: true,
          childId: PAYLOAD.childId,
          facilityId: PAYLOAD.facilityId,
          date: PAYLOAD.dateStr,
          finalUrl: postResponse.url,
          ruleKey: 'professional_support_draft_post',
        };
      } catch (error) {
        return {
          ok: false,
          saved: false,
          error: error?.message ? String(error.message) : String(error),
        };
      }
    })()
  `

  return webview.executeJavaScript(script)
}

export async function executeProfessionalSupportUseDaysCheckInWebview(
  webview,
  opts,
) {
  const { childId, facilityId = '3', interviewDate = '' } = opts || {}

  const { config } = await loadWebAutomationRuleConfig({
    flowKey: 'professional_support_use_days_check',
    expectedRuleKey: 'professional_support_use_days_check',
  })

  const script = `
    (async () => {
      const CONFIG = ${JSON.stringify(config)};
      const C_ID = ${JSON.stringify(String(childId))};
      const F_ID = ${JSON.stringify(String(facilityId))};
      const INTERVIEW_DATE_END_INPUT = ${JSON.stringify(String(interviewDate || ''))};

      const normalizeText = (el) =>
        (el?.textContent ?? '').replace(/\\s+/g, ' ').trim();

      const pad2 = (value) => String(value).padStart(2, '0');

      const toJapaneseDate = (value) => {
        const text = String(value || '').trim();

        if (!text) return '';

        const jp = text.match(/^(\\d{4})年(\\d{1,2})月(\\d{1,2})日$/);
        if (jp) {
          return jp[1] + '年' + pad2(jp[2]) + '月' + pad2(jp[3]) + '日';
        }

        const ymd = text.match(/^(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})$/);
        if (ymd) {
          return ymd[1] + '年' + pad2(ymd[2]) + '月' + pad2(ymd[3]) + '日';
        }

        return text;
      };

      const getMonthStartJapaneseDate = (dateText) => {
        const jpDate = toJapaneseDate(dateText);
        const match = jpDate.match(/^(\\d{4})年(\\d{1,2})月(\\d{1,2})日$/);

        if (!match) {
          throw new Error('日付形式を解析できません: ' + dateText);
        }

        return match[1] + '年' + pad2(match[2]) + '月01日';
      };

      const extractRecordId = (onclick) => {
        const match = String(onclick || '').match(/[?&]id=(\\d+)/);
        return match ? match[1] : null;
      };

      const getCsrfToken = (doc) =>
        doc.querySelector(CONFIG.csrf?.selector || '[name="csrf_token_from_client"]')?.value?.trim() || '';

      const getModeToken = (doc) =>
        doc.querySelector(CONFIG.modeToken?.selector || '[name="mode_token"]')?.value?.trim() ||
        CONFIG.modeToken?.defaultValue ||
        'nomode';

      const fetchSearchFormDoc = async () => {
        const response = await fetch(CONFIG.request.url, {
          method: CONFIG.request.form_method || 'GET',
          credentials: CONFIG.request.credentials || 'include',
          cache: 'no-store',
        });

        const html = await response.text();

        if (!response.ok) {
          throw new Error('検索フォーム取得 HTTP error: ' + response.status);
        }

        const doc = new DOMParser().parseFromString(html, 'text/html');

        if (!doc.querySelector(CONFIG.formCheck?.selector || '#form_id') && !getCsrfToken(doc)) {
          throw new Error('検索フォームが取得できません。HUGへのログイン状態を確認してください');
        }

        return doc;
      };

      const buildSearchParams = (doc, interviewDateStart, interviewDateEnd) => {
        const csrf = getCsrfToken(doc);

        if (!csrf) {
          throw new Error('csrf_token_from_client が取得できません');
        }

        const params = new URLSearchParams();
        const search = CONFIG.search || {};

        params.set('mode', search.mode || 'search');
        params.set('mode_token', getModeToken(doc));
        params.set('csrf_token_from_client', csrf);

        params.set('f_ary[' + F_ID + ']', F_ID);
        params.set('c_id', C_ID);
        params.append('search', '');

        params.set(search.startDateField || 'interview_date', interviewDateStart);
        params.set(search.endDateField || 'interview_date_end', interviewDateEnd);

        const services = search.services || {
          1: '放課後等デイサービス',
          2: '児童発達支援',
        };

        Object.entries(services).forEach(([key, value]) => {
          params.set('s_ary[' + key + ']', value);
        });

        params.set('adding_children_id', CONFIG.constants?.professional_support_id || '55');
        params.set('recorder', '');

        return params;
      };

      const isMeaningfulRow = (row) => {
        if (row.recordId) return true;

        return [
          row.childName,
          row.additionName,
          row.facilityName,
          row.service,
          row.recorder,
          row.interviewDate,
          row.status,
          row.signed,
          row.lastUpdated,
        ].some((v) => String(v || '').trim() !== '');
      };

      const parseResultTable = (doc) => {
        const table = doc.querySelector(CONFIG.table?.selector || 'div.contents div.ibox div.mb40 table.table');

        if (!table) {
          return {
            table: null,
            headers: [],
            rows: [],
          };
        }

        const headers = [...table.querySelectorAll(CONFIG.table?.headerSelector || 'thead th')]
          .map((th) => normalizeText(th));

        const rows = [...table.querySelectorAll(CONFIG.table?.rowSelector || 'tbody tr')]
          .map((tr) => {
            const cells = [...tr.querySelectorAll('td')];
            const detailOnclick =
              cells[0]?.querySelector('[onclick]')?.getAttribute('onclick') || '';
            const statusEl = cells[7]?.querySelector('.label');

            return {
              recordId: extractRecordId(detailOnclick),
              childName: normalizeText(cells[1]),
              additionName: normalizeText(cells[2]),
              facilityName: normalizeText(cells[3]),
              service: normalizeText(cells[4]),
              recorder: normalizeText(cells[5]),
              interviewDate: normalizeText(cells[6]),
              status: statusEl?.textContent?.trim() || normalizeText(cells[7]),
              signed: normalizeText(cells[8]),
              lastUpdated: normalizeText(cells[9]),
            };
          })
          .filter(isMeaningfulRow);

        return {
          table,
          headers,
          rows,
        };
      };

      try {
        const interviewDateEnd = toJapaneseDate(INTERVIEW_DATE_END_INPUT);
        const interviewDateStart = getMonthStartJapaneseDate(interviewDateEnd);

        const formDoc = await fetchSearchFormDoc();
        const body = buildSearchParams(formDoc, interviewDateStart, interviewDateEnd);

        console.log('[HUG WM] 専門的支援 保存済み件数確認 DB Flow');
        console.log('[HUG WM] POST検索 URL:', CONFIG.request.url);
        console.log('[HUG WM] POST payload:', Object.fromEntries(body));

        const response = await fetch(CONFIG.request.url, {
          method: CONFIG.request.method || 'POST',
          credentials: CONFIG.request.credentials || 'include',
          headers: {
            'Content-Type': CONFIG.request.contentType || 'application/x-www-form-urlencoded; charset=UTF-8',
          },
          body: body.toString(),
        });

        const html = await response.text();

        if (!response.ok) {
          throw new Error('検索POST HTTP error: ' + response.status);
        }

        const resultDoc = new DOMParser().parseFromString(html, 'text/html');
        const { table, headers, rows } = parseResultTable(resultDoc);

        if (!table) {
          console.warn('[HUG WM] 結果テーブルが見つかりません');
          console.log('[HUG WM] レスポンス先頭:', html.slice(0, 500));

          return {
            ok: false,
            error: '検索結果テーブルが見つかりません',
          };
        }

        const days = rows.length;

        console.log('[HUG WM] テーブル列:', headers);
        console.log('[HUG WM] 児童ID:', C_ID);
        console.log('[HUG WM] 実施日:', interviewDateStart, '〜', interviewDateEnd);
        console.log('[HUG WM] 施設ID:', F_ID);
        console.log('[HUG WM] 専門的支援 保存済み件数:', days, '件');

        if (rows.length > 0) {
          console.table(rows);
        }

        return {
          ok: true,
          cId: C_ID,
          interview_date: interviewDateStart,
          interview_date_end: interviewDateEnd,
          s_id: '',
          f_id: F_ID,
          days,
          label: '利用日数：' + days + '日',
          rows,
          ruleKey: 'professional_support_use_days_check',
        };
      } catch (error) {
        console.error('[HUG WM] 利用日数取得エラー:', error);

        return {
          ok: false,
          error: error && error.message ? String(error.message) : String(error),
        };
      }
    })()
  `

  return webview.executeJavaScript(script)
}

export async function executeProfessionalSupportPlusRegister({
  childId,
  facilityId,
  dateStr,
}) {
  if (!childId) throw new Error('児童が選択されていません')
  if (!dateStr) throw new Error('日付が指定されていません')
  if (!facilityId) throw new Error('施設が指定されていません')

  const webview = await getHugWebviewOrThrow()
  const { config } = await loadWebAutomationRuleConfig({
    flowKey: 'professional_support_plus_register',
    expectedRuleKey: 'professional_support_plus_register',
  })

  const script = `
    (async () => {
      const CONFIG = ${JSON.stringify(config)};
      const CHILD_ID = ${JSON.stringify(String(childId))};
      const DATE_STR = ${JSON.stringify(String(dateStr))};
      const FACILITY_ID = ${JSON.stringify(String(facilityId))};

      try {
        const professionalSupportId = CONFIG.constants?.professional_support_id || '55';
        const detailUrl = new URL(CONFIG.request.detail_url);
        const query = CONFIG.request.detail_query || {};
        detailUrl.searchParams.set('mode', query.mode || 'detail');
        detailUrl.searchParams.set('f_id', FACILITY_ID);
        detailUrl.searchParams.set('date', DATE_STR);

        const detailResponse = await fetch(detailUrl.href, {
          method: CONFIG.request.detail_method || 'GET',
          credentials: CONFIG.request.credentials || 'include',
        });

        if (!detailResponse.ok) {
          throw new Error('加算一覧取得失敗 (' + detailResponse.status + ')');
        }

        const html = await detailResponse.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const selectors = CONFIG.selectors || {};
        const tbodies = Array.from(doc.querySelectorAll(selectors.tbody || "tbody[id^='js_adding_list']"));

        const targetTbody = tbodies.find((tbody) => {
          const cId = tbody.querySelector(selectors.childInput || '[name="c_id"]')?.value;
          return String(cId || '') === CHILD_ID;
        });

        if (!targetTbody) {
          throw new Error('加算一覧に対象児童が見つかりません: childId=' + CHILD_ID);
        }

        const rowFacilityId = targetTbody.querySelector(selectors.facilityInput || '[name="f_id"]')?.value || '';
        const resolvedFacilityId = FACILITY_ID || rowFacilityId;
        const hoikuFlg = targetTbody.querySelector(selectors.hoikuInput || '[name="hoiku_flg"]')?.value || '';

        if (!resolvedFacilityId) {
          throw new Error('対象児童の f_id を取得できません');
        }

        const body = new URLSearchParams();
        body.append('adding[selected_content]', professionalSupportId);
        body.append('c_id', CHILD_ID);
        body.append('f_id', resolvedFacilityId);
        body.append('hoiku_flg', hoikuFlg);
        body.append('date', DATE_STR);
        body.append('mode', 'regist');

        const postResponse = await fetch(CONFIG.request.post_url, {
          method: CONFIG.request.post_method || 'POST',
          headers: {
            'Content-Type': CONFIG.request.contentType || 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': CONFIG.request.requestedWith || 'XMLHttpRequest',
          },
          body: body.toString(),
          credentials: CONFIG.request.credentials || 'include',
        });

        const responseText = await postResponse.text();

        if (!postResponse.ok) {
          throw new Error(
            '専門的支援加算POST失敗 (' + postResponse.status + '): ' +
            responseText.slice(0, 300)
          );
        }

        return {
          ok: true,
          childId: CHILD_ID,
          facilityId: resolvedFacilityId,
          date: DATE_STR,
          selectedContent: professionalSupportId,
          responseText: responseText.slice(0, 500),
          ruleKey: 'professional_support_plus_register',
        };
      } catch (error) {
        return {
          ok: false,
          error: error?.message ? String(error.message) : String(error),
        };
      }
    })()
  `

  const result = await webview.executeJavaScript(script)

  if (!result?.ok) {
    throw new Error(result?.error || '専門的支援加算の登録に失敗しました')
  }

  return result
}

export async function executeProfessionalSupportPlusRegistrationCheck({
  childId,
  facilityId,
  dateStr,
}) {
  if (!childId) throw new Error('児童が選択されていません')
  if (!dateStr) throw new Error('日付が指定されていません')
  if (!facilityId) throw new Error('施設が指定されていません')

  const webview = await getHugWebviewOrThrow()
  const { config } = await loadWebAutomationRuleConfig({
    flowKey: 'professional_support_plus_registration_check',
    expectedRuleKey: 'professional_support_plus_registration_check',
  })

  const script = `
    (async () => {
      const CONFIG = ${JSON.stringify(config)};
      const CHILD_ID = ${JSON.stringify(String(childId))};
      const DATE_STR = ${JSON.stringify(String(dateStr))};
      const FACILITY_ID = ${JSON.stringify(String(facilityId))};

      try {
        const professionalSupportId = CONFIG.constants?.professional_support_id || '55';
        const detailUrl = new URL(CONFIG.request.detail_url);
        const query = CONFIG.request.detail_query || {};
        detailUrl.searchParams.set('mode', query.mode || 'detail');
        detailUrl.searchParams.set('f_id', FACILITY_ID);
        detailUrl.searchParams.set('date', DATE_STR);

        const response = await fetch(detailUrl.href, {
          method: CONFIG.request.detail_method || 'GET',
          credentials: CONFIG.request.credentials || 'include',
        });

        if (!response.ok) {
          throw new Error('出席表取得失敗 (' + response.status + ')');
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const selectors = CONFIG.selectors || {};
        const tbodies = Array.from(doc.querySelectorAll(selectors.tbody || "tbody[id^='js_adding_list']"));

        const targetTbody = tbodies.find((tbody) => {
          const cId = tbody.querySelector(selectors.childInput || '[name="c_id"]')?.value;
          return String(cId || '') === CHILD_ID;
        });

        if (!targetTbody) {
          return {
            ok: true,
            registered: false,
            childFound: false,
            childId: CHILD_ID,
            date: DATE_STR,
            facilityId: FACILITY_ID,
            url: detailUrl.href,
          };
        }

        const hiddenName = 'adding[][' + professionalSupportId + '][id]';
        const registrationInput = Array.from(
          targetTbody.querySelectorAll('input[type="hidden"][name]')
        ).find((input) => input.getAttribute('name') === hiddenName);

        const registeredByHiddenId = Boolean(
          registrationInput && String(registrationInput.value || '').trim()
        );

        const registeredByLabel = Array.from(
          targetTbody.querySelectorAll(selectors.registeredLabel || '.js_adding_td b.green, .js_adding_td b')
        ).some((element) =>
          String(element.textContent || '')
            .replace(/\\s+/g, '')
            .includes(CONFIG.match?.labelText || '専門的支援実施加算')
        );

        return {
          ok: true,
          registered: registeredByHiddenId || registeredByLabel,
          childFound: true,
          childId: CHILD_ID,
          date: DATE_STR,
          facilityId: FACILITY_ID,
          registrationId: registrationInput?.value || null,
          url: detailUrl.href,
          ruleKey: 'professional_support_plus_registration_check',
        };
      } catch (error) {
        return {
          ok: false,
          registered: false,
          error: error?.message ? String(error.message) : String(error),
        };
      }
    })()
  `

  const result = await webview.executeJavaScript(script)

  if (!result?.ok) {
    throw new Error(result?.error || '専門＋の登録状態確認に失敗しました')
  }

  return result
}
