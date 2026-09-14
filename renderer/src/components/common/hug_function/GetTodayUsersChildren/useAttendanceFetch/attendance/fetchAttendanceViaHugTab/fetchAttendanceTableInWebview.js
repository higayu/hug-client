function replaceTemplateString(value, variables) {
  if (typeof value !== 'string') return value;

  return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key) => {
    const normalizedKey = String(key || '').trim();
    const replacement = variables?.[normalizedKey];
    return replacement == null ? '' : String(replacement);
  });
}

function expandTemplates(value, variables) {
  if (Array.isArray(value)) {
    return value.map((item) => expandTemplates(item, variables));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        replaceTemplateString(key, variables),
        expandTemplates(item, variables),
      ]),
    );
  }

  return replaceTemplateString(value, variables);
}

/**
 * DB の web_automation_rules.config_json に基づいて、
 * HUGログイン済みWebView内で利用者テーブルHTMLを取得する。
 *
 * @param {Electron.WebviewTag} webview
 * @param {{
 *   facilityId: string,
 *   dateStr: string,
 *   rule: object,
 *   step?: object,
 *   flow?: object,
 * }} opts
 */
export async function fetchAttendanceTableInWebview(webview, opts) {
  const {
    facilityId,
    dateStr,
    rule,
    step,
    flow,
  } = opts || {};

  if (!webview) {
    return { ok: false, error: 'webview がありません' };
  }

  if (!facilityId || !dateStr) {
    return { ok: false, error: '施設IDまたは日付がありません' };
  }

  if (!rule) {
    return { ok: false, error: '自動化Ruleがありません' };
  }

  if (rule.action_type !== 'fetch') {
    return {
      ok: false,
      error: `未対応の action_type です: ${rule.action_type || '(empty)'}`,
    };
  }

  const variables = {
    facilityId: String(facilityId),
    dateStr: String(dateStr),
  };

  const expandedRuleConfig = expandTemplates(
    rule.config_json || {},
    variables,
  );
  const expandedStepInput = expandTemplates(
    step?.input_json || {},
    variables,
  );
  const expandedStepConfig = expandTemplates(
    step?.config_json || {},
    variables,
  );

  const runtimeConfig = {
    flowKey: flow?.flow_key || '',
    ruleKey: rule?.rule_key || '',
    actionType: rule?.action_type || '',
    parserType: rule?.parser_type || '',
    targetUrlPattern: rule?.target_url_pattern || '',
    targetSelector: rule?.target_selector || '',
    ruleConfig: expandedRuleConfig,
    stepInput: expandedStepInput,
    stepConfig: expandedStepConfig,
  };

  const script = `
    (async () => {
      const RUNTIME = ${JSON.stringify(runtimeConfig)};
      const CONFIG = RUNTIME.ruleConfig || {};
      const REQUEST = CONFIG.request || {};
      const LOGIN_CHECK = CONFIG.loginCheck || {};
      const TABLE = CONFIG.table || {};
      const RESPONSE = CONFIG.response || {};

      const baseUrl = REQUEST.url || RUNTIME.targetUrlPattern || '';
      if (!baseUrl) {
        return { ok: false, error: 'request.url が設定されていません' };
      }

      const query = REQUEST.query || {};
      const url = new URL(baseUrl, window.location.href);

      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        url.searchParams.set(key, String(value));
      });

      const targetUrl = url.toString();

      const extractTableFromDocument = (doc) => {
        const selectors = [
          TABLE.primarySelector,
          RUNTIME.targetSelector,
          TABLE.fallbackSelector,
          'table',
        ].filter(Boolean);

        let table = null;
        for (const selector of selectors) {
          try {
            table = doc.querySelector(selector);
          } catch (error) {
            console.warn('[WebAutomation] selector error:', selector, error);
          }

          if (table) break;
        }

        if (!table) return null;

        const rows = table.querySelectorAll('tr');
        return {
          html: table.outerHTML,
          rowCount: rows.length,
          className: table.className || '',
        };
      };

      try {
        console.log('[WebAutomation] fetch開始:', {
          flowKey: RUNTIME.flowKey,
          ruleKey: RUNTIME.ruleKey,
          targetUrl,
        });

        const response = await fetch(targetUrl, {
          method: String(REQUEST.method || 'GET').toUpperCase(),
          credentials: REQUEST.credentials || 'include',
          redirect: REQUEST.redirect || 'follow',
          headers: REQUEST.headers || undefined,
        });

        if (!response.ok) {
          throw new Error('HTTP error: ' + response.status);
        }

        const pageHtml = await response.text();
        const doc = new DOMParser().parseFromString(pageHtml, 'text/html');

        if (LOGIN_CHECK.enabled !== false) {
          const loginInputSelector =
            LOGIN_CHECK.loginInputSelector || 'input[name="username"]';
          const titleContains = LOGIN_CHECK.titleContains || '';
          const htmlContains = LOGIN_CHECK.htmlContains || '';

          const isLoginPage =
            (loginInputSelector && doc.querySelector(loginInputSelector) !== null) ||
            (titleContains && (doc.title || '').includes(titleContains)) ||
            (htmlContains && pageHtml.includes(htmlContains));

          if (isLoginPage) {
            throw new Error(
              'ログインページが返されました。HUGへのログイン状態を確認してください',
            );
          }
        }

        const tableResult = extractTableFromDocument(doc);
        if (!tableResult) {
          throw new Error('テーブルが見つかりません');
        }

        return {
          ok: true,
          html: RESPONSE.returnHtml === false ? '' : tableResult.html,
          rowCount:
            RESPONSE.returnRowCount === false
              ? undefined
              : tableResult.rowCount,
          className: tableResult.className,
          pageTitle:
            RESPONSE.returnPageTitle === false ? '' : (doc.title || ''),
          pageUrl:
            RESPONSE.returnPageUrl === false
              ? ''
              : (response.url || targetUrl),
          flowKey: RUNTIME.flowKey,
          ruleKey: RUNTIME.ruleKey,
          actionType: RUNTIME.actionType,
          parserType: RUNTIME.parserType,
        };
      } catch (error) {
        console.error('[WebAutomation] 利用者テーブル取得エラー:', error);
        return {
          ok: false,
          error: error && error.message ? String(error.message) : String(error),
          flowKey: RUNTIME.flowKey,
          ruleKey: RUNTIME.ruleKey,
        };
      }
    })()
  `;

  try {
    return await webview.executeJavaScript(script);
  } catch (error) {
    return {
      ok: false,
      error: error?.message ? String(error.message) : String(error),
    };
  }
}
