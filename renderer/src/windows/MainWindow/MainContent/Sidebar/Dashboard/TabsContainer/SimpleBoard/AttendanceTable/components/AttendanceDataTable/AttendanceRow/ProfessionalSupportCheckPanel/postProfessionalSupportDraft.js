import { getHugWebviewForCache } from '@/hooks/useHugCache/getHugCache.js'

const FORM_URL = 'https://www.hug-ayumu.link/hug/wm/record_proceedings.php?mode=edit'
const POST_URL = 'https://www.hug-ayumu.link/hug/wm/record_proceedings.php'
const PROFESSIONAL_SUPPORT_ID = '55'

/**
 * renderer で入力した専門的支援の内容を、HUG の編集画面を開かずに直接 POST する。
 * Cookie / CSRF は既存の HUG webview セッションを利用する。
 */
export async function postProfessionalSupportDraft({
  childId,
  facilityId,
  dateStr,
  startTime = '',
  endTime = '',
  staffId,
  title = '記録',
  contents = '',
}) {
  if (!childId) throw new Error('児童IDがありません')
  if (!facilityId) throw new Error('施設IDがありません')
  if (!dateStr) throw new Error('実施日がありません')
  if (!staffId) throw new Error('記録者IDがありません')
  if (!String(contents || '').trim()) throw new Error('記録内容を入力してください')

  const webview = await getHugWebviewForCache()
  if (!webview) throw new Error('HUG の WebView が見つかりません')

  const payload = {
    childId: String(childId),
    facilityId: String(facilityId),
    dateStr: String(dateStr),
    startTime: String(startTime || ''),
    endTime: String(endTime || ''),
    staffId: String(staffId),
    title: String(title || '記録'),
    contents: String(contents || ''),
  }

  const script = `
    (async () => {
      const PAYLOAD = ${JSON.stringify(payload)};
      const FORM_URL = ${JSON.stringify(FORM_URL)};
      const POST_URL = ${JSON.stringify(POST_URL)};
      const PROFESSIONAL_SUPPORT_ID = ${JSON.stringify(PROFESSIONAL_SUPPORT_ID)};

      const toJapaneseDate = (ymd) => {
        const m = String(ymd || '').match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})$/);
        if (!m) return String(ymd || '');
        return m[1] + '年' + String(m[2]).padStart(2, '0') + '月' + String(m[3]).padStart(2, '0') + '日';
      };

      const splitTime = (time) => {
        const m = String(time || '').match(/^(\\d{1,2}):(\\d{2})$/);
        if (!m) return { hour: '', minute: '' };
        return { hour: String(Number(m[1])), minute: String(Number(m[2])) };
      };

      // HUG の save click 時に行われている WAF 回避処理に合わせる。
      const resolveWaf = (value) => {
        let note = String(value ?? '');
        const words = ['and', 'or', 'where', 'left', 'join', '(', ')', 'like'];

        for (const word of words) {
          const escaped = Array.from(String(word))
            .map((ch) => '^$.*+?()[]{}|'.includes(ch) ? '\\\\' + ch : ch)
            .join('');
          const re = new RegExp(escaped, 'ig');
          const matches = note.match(re);
          if (!matches) continue;

          for (const matched of matches) {
            note = note.replace(matched + ' ', '*-_-*' + matched + '*-_-* ');
            note = note.replace(' ' + matched, ' *-_-*' + matched + '*-_-*');
            note = note.replace(matched + '　', '*-_-*' + matched + '*-_-*　');
            note = note.replace('　' + matched, '　*-_-*' + matched + '*-_-*');
            note = note.replace(/"/g, 'カンマ');
            note = note.replace(/”/g, 'ゼカンマ');
            note = note.replace(/\\(/g, 'カッコマエ');
            note = note.replace(/\\)/g, 'カッコアト');
            note = note.replace(/（/g, 'ゼカッコマエ');
            note = note.replace(/）/g, 'ゼカッコアト');
          }
        }

        return note;
      };

      try {
        // CSRF を毎回最新のフォームから取得する。
        const formResponse = await fetch(FORM_URL, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!formResponse.ok) {
          throw new Error('登録フォーム取得失敗 (' + formResponse.status + ')');
        }

        const formHtml = await formResponse.text();
        const formDoc = new DOMParser().parseFromString(formHtml, 'text/html');
        const csrf = formDoc.querySelector('#csrf_token_from_client')?.value || '';

        if (!csrf) {
          throw new Error('CSRFトークンを取得できませんでした');
        }

        const start = splitTime(PAYLOAD.startTime);
        const end = splitTime(PAYLOAD.endTime);
        const body = new FormData();

        body.append('mode', 'regist');
        body.append('draft_flg', 'draft');
        body.append('id', 'insert');
        // 手動下書き保存時の実送信データに合わせる。
        body.append('select_s_id', '');
        body.append('ap_flg', '0');
        body.append('ap_id', '0');
        body.append('mode_token', 'edit');
        body.append('csrf_token_from_client', csrf);

        body.append('adding_children_id', PROFESSIONAL_SUPPORT_ID);
        body.append('title', '');

        // HUGの手動送信では配列キーに児童IDそのものが使われる。
        const childKey = PAYLOAD.childId;
        body.append('c_id_list[' + childKey + '][id]', PAYLOAD.childId);
        body.append('c_id_list[' + childKey + '][person_absence_note]', '');
        body.append('c_id_list[' + childKey + '][f_id]', PAYLOAD.facilityId);
        body.append('c_id_list[' + childKey + '][s_id]', '1');

        body.append('recorder', PAYLOAD.staffId);
        body.append('interview_date', toJapaneseDate(PAYLOAD.dateStr));
        body.append('start_hour', start.hour);
        body.append('start_time', start.minute);
        body.append('end_hour', end.hour);
        body.append('end_time', end.minute);
        body.append('start_hour2', '');
        body.append('start_time2', '');
        body.append('end_hour2', '');
        body.append('end_time2', '');
        body.append('add_date', '');
        body.append('nursing_support_date', '');
        body.append('interview_staff[]', PAYLOAD.staffId);
        body.append('ro_list[1][related_organizations]', '');
        body.append('ro_list[1][related_organizations_manager]', '');
        body.append('ro_list[2][related_organizations]', '');
        body.append('ro_list[2][related_organizations_manager]', '');
        body.append('support_office_id', '0');
        body.append('support_office_manager', '');

        body.append('customize[title][]', resolveWaf(PAYLOAD.title));
        body.append('customize[contents][]', resolveWaf(PAYLOAD.contents));

        console.log('[ProfessionalSupport POST] manual-repro payload', {
          mode: body.get('mode'),
          draft_flg: body.get('draft_flg'),
          id: body.get('id'),
          select_s_id: body.get('select_s_id'),
          adding_children_id: body.get('adding_children_id'),
          child_id: body.get('c_id_list[' + PAYLOAD.childId + '][id]'),
          child_f_id: body.get('c_id_list[' + PAYLOAD.childId + '][f_id]'),
          child_s_id: body.get('c_id_list[' + PAYLOAD.childId + '][s_id]'),
          recorder: body.get('recorder'),
          interview_date: body.get('interview_date'),
          start_hour: body.get('start_hour'),
          start_time: body.get('start_time'),
          end_hour: body.get('end_hour'),
          end_time: body.get('end_time'),
          interview_staff: body.getAll('interview_staff[]'),
          support_office_id: body.get('support_office_id'),
          customize_title: body.get('customize[title][]'),
        });

        const postResponse = await fetch(POST_URL, {
          method: 'POST',
          body,
          credentials: 'include',
          redirect: 'follow',
        });

        const responseText = await postResponse.text();

        if (!postResponse.ok) {
          throw new Error(
            '専門的支援POST失敗 (' + postResponse.status + '): ' +
            responseText.slice(0, 300)
          );
        }

        const resultDoc = new DOMParser().parseFromString(responseText, 'text/html');
        const errors = Array.from(resultDoc.querySelectorAll('.js_data_err, p.err'))
          .map((el) => String(el.textContent || '').replace(/\\s+/g, ' ').trim())
          .filter(Boolean);

        // バリデーションエラー時は編集フォームが再表示される。
        if (errors.length > 0) {
          throw new Error(errors.slice(0, 3).join(' / '));
        }

        const formStillVisible = Boolean(resultDoc.querySelector('#form_id'));
        if (formStillVisible) {
          throw new Error('保存後も登録フォームが表示されました。入力内容を確認してください');
        }

        return {
          ok: true,
          saved: true,
          childId: PAYLOAD.childId,
          facilityId: PAYLOAD.facilityId,
          date: PAYLOAD.dateStr,
          finalUrl: postResponse.url,
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

  const result = await webview.executeJavaScript(script)

  if (!result?.ok || result?.saved !== true) {
    throw new Error(result?.error || '専門的支援の下書き保存に失敗しました')
  }

  return result
}
