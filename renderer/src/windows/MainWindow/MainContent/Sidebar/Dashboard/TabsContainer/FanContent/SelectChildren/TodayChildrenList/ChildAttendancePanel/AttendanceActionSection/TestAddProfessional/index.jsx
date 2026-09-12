import { useState } from 'react'
import { useAppState } from '@/AppStateContext'
import { getHugWebviewForCache } from '@/hooks/useHugCache/getHugCache.js'

const PROFESSIONAL_SUPPORT_ID = '55'

/**
 * 専門的支援実施加算を登録する。
 *
 * childId / dateStr はボタンを押した chilledspace と
 * 全体指定日付から取得した値をそのまま使用する。
 * 専門的支援実施加算の ID=55 は固定。
 */
async function addProfessionalSupport({ childId, dateStr }) {
  if (!childId) {
    throw new Error('児童が選択されていません')
  }

  if (!dateStr) {
    throw new Error('日付が指定されていません')
  }

  const webview = await getHugWebviewForCache()

  if (!webview) {
    throw new Error('HUG の WebView が見つかりません')
  }

  const script = `
    (async () => {
      const CHILD_ID = ${JSON.stringify(String(childId))};
      const DATE_STR = ${JSON.stringify(String(dateStr))};
      const PROFESSIONAL_SUPPORT_ID = ${JSON.stringify(PROFESSIONAL_SUPPORT_ID)};

      const BASE_URL = new URL(
        './',
        'https://www.hug-ayumu.link/hug/wm/attendance.php?mode=detail'
      ).href;

      const detailUrl = new URL('attendance.php', BASE_URL);
      detailUrl.searchParams.set('mode', 'detail');
      detailUrl.searchParams.set('date', DATE_STR);

      const postUrl = new URL(
        'ajax/ajax_adding_contents_2024.php',
        BASE_URL
      ).href;

      try {
        // 対象日の加算一覧から、対象児童に紐づく f_id / hoiku_flg を取得する。
        const detailResponse = await fetch(detailUrl.href, {
          method: 'GET',
          credentials: 'include'
        });

        if (!detailResponse.ok) {
          throw new Error(
            '加算一覧取得失敗 (' + detailResponse.status + ')'
          );
        }

        const html = await detailResponse.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const tbodies = Array.from(
          doc.querySelectorAll("tbody[id^='js_adding_list']")
        );

        const targetTbody = tbodies.find((tbody) => {
          const cId = tbody.querySelector('[name="c_id"]')?.value;
          return String(cId || '') === CHILD_ID;
        });

        if (!targetTbody) {
          throw new Error(
            '加算一覧に対象児童が見つかりません: childId=' + CHILD_ID
          );
        }

        const facilityId =
          targetTbody.querySelector('[name="f_id"]')?.value || '';

        const hoikuFlg =
          targetTbody.querySelector('[name="hoiku_flg"]')?.value || '';

        if (!facilityId) {
          throw new Error('対象児童の f_id を取得できません');
        }

        const body = new URLSearchParams();
        body.append('adding[selected_content]', PROFESSIONAL_SUPPORT_ID);
        body.append('c_id', CHILD_ID);
        body.append('f_id', facilityId);
        body.append('hoiku_flg', hoikuFlg);
        body.append('date', DATE_STR);
        body.append('mode', 'regist');

        const postResponse = await fetch(postUrl, {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: body.toString(),
          credentials: 'include'
        });

        const responseText = await postResponse.text();

        if (!postResponse.ok) {
          throw new Error(
            '専門的支援加算POST失敗 (' +
              postResponse.status +
              '): ' +
              responseText.slice(0, 300)
          );
        }

        return {
          ok: true,
          childId: CHILD_ID,
          facilityId,
          hoikuFlg,
          date: DATE_STR,
          selectedContent: PROFESSIONAL_SUPPORT_ID,
          responseText: responseText.slice(0, 500)
        };
      } catch (error) {
        return {
          ok: false,
          error:
            error && error.message
              ? String(error.message)
              : String(error)
        };
      }
    })()
  `

  const result = await webview.executeJavaScript(script)

  console.log('[TestAddProfessional] result:', result)

  if (!result?.ok) {
    throw new Error(result?.error || '専門的支援加算の登録に失敗しました')
  }

  return result
}

/**
 * 専門的支援追加テスト
 *
 * spaceId に対応する chilledspace で選択中の児童と、
 * アプリ全体の指定日付を使用して専門的支援実施加算を登録する。
 */
export default function TestAddProfessional({ spaceId }) {
  const {
    appState,
    chilledSpaces,
    CURRENT_YMD,
  } = useAppState()

  const currentSpace = chilledSpaces?.[spaceId] ?? {}
  const childId = currentSpace.childId ?? ''
  const dateStr = CURRENT_YMD ?? appState?.CURRENT_YMD ?? ''

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const onClick = async () => {
    if (loading) return

    setLoading(true)
    setMessage('')

    try {
      console.log('[TestAddProfessional] request:', {
        spaceId,
        childId,
        dateStr,
        professionalSupportId: PROFESSIONAL_SUPPORT_ID,
      })

      await addProfessionalSupport({
        childId,
        dateStr,
      })

      setMessage('登録OK')
    } catch (error) {
      console.error('[TestAddProfessional] error:', error)
      setMessage(`登録NG: ${error?.message || error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={onClick}
        disabled={!childId || !dateStr || loading}
        className="w-full rounded bg-red-600 p-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
        title={`専門的支援実施加算(ID=55)を登録: ${spaceId}`}
      >
        {loading ? '専門＋ 登録中...' : '専門＋'}
      </button>

      {message ? (
        <p className="mt-1 break-all text-xs">
          {message}
        </p>
      ) : null}
    </div>
  )
}
