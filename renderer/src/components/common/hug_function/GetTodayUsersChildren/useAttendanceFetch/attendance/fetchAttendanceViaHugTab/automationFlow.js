const APP_KEY = 'hug-banso-navi';
const WEBVIEW_KEY = '*';
const FLOW_KEY = 'attendance_fetch_today_users';

function unwrapData(result) {
  if (result?.data?.data && !Array.isArray(result.data.data)) {
    return result.data.data;
  }

  if (result?.data && !Array.isArray(result.data)) {
    return result.data;
  }

  return result ?? null;
}

function normalizeJson(value, fallback = {}) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

/**
 * Laravel から GetTodayUsersChildren 用の Flow を取得する。
 * Flow -> Step -> Rule の構造をそのまま利用する。
 */
export async function getAttendanceFetchFlow() {
  const api = window.electronAPI?.laravel_webAutomationFlow_get;

  if (typeof api !== 'function') {
    return {
      ok: false,
      error: 'laravel_webAutomationFlow_get が preload に公開されていません',
    };
  }

  try {
    const result = await api(FLOW_KEY, {
      app_key: APP_KEY,
      webview_key: WEBVIEW_KEY,
    });

    if (!result?.success) {
      return {
        ok: false,
        error:
          result?.message ||
          result?.error ||
          `${FLOW_KEY} の取得に失敗しました`,
      };
    }

    const flow = unwrapData(result);

    if (!flow) {
      return {
        ok: false,
        error: `${FLOW_KEY} が見つかりません`,
      };
    }

    const steps = Array.isArray(flow.steps)
      ? [...flow.steps]
          .filter((step) => step?.is_active !== false)
          .sort(
            (a, b) =>
              Number(a?.step_order ?? 0) - Number(b?.step_order ?? 0),
          )
      : [];

    const step = steps.find(
      (item) => item?.step_type === 'rule' && item?.rule,
    );

    if (!step?.rule) {
      return {
        ok: false,
        error: `${FLOW_KEY} に実行可能なRule Stepがありません`,
      };
    }

    if (step.rule.is_active === false) {
      return {
        ok: false,
        error: `${step.rule.rule_key || 'Rule'} は無効です`,
      };
    }

    return {
      ok: true,
      flow: {
        ...flow,
        config_json: normalizeJson(flow.config_json),
      },
      step: {
        ...step,
        input_json: normalizeJson(step.input_json),
        config_json: normalizeJson(step.config_json),
      },
      rule: {
        ...step.rule,
        config_json: normalizeJson(step.rule.config_json),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error?.message ? String(error.message) : String(error),
    };
  }
}
