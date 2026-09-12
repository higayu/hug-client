/**
 * 専門的支援の入力画面で「下書きとして保存する」を押し、
 * POST後の画面まで待って保存結果を返す。
 *
 * @param {Electron.WebviewTag} webview
 * @returns {Promise<{ok:boolean,message?:string,error?:string,url?:string,responseText?:string}>}
 */
export async function saveProfessionalSupportDraft(webview) {
  if (!webview) {
    return {
      ok: false,
      error: '専門的支援の WebView が見つかりません',
    }
  }

  return new Promise(async (resolve) => {
    let finished = false
    let submitted = false

    const cleanup = () => {
      webview.removeEventListener('did-stop-loading', handleStopLoading)
      webview.removeEventListener('did-fail-load', handleFailLoad)
    }

    const finish = (result) => {
      if (finished) return
      finished = true
      cleanup()
      resolve(result)
    }

    const handleFailLoad = (event) => {
      if (!submitted) return

      finish({
        ok: false,
        error: `下書き保存後の画面読み込みに失敗しました: ${event?.errorDescription || 'unknown error'}`,
      })
    }

    const handleStopLoading = async () => {
      if (!submitted) return

      try {
        const result = await webview.executeJavaScript(`
          (() => {
            const bodyText = document.body?.innerText || '';
            const url = location.href;
            const form = document.querySelector('#form_id');
            const draftButton = document.querySelector(
              'button.draft.save[value="draft"]'
            );

            const successMessagePatterns = [
              /保存しました/,
              /登録しました/,
              /下書き[^\\n]{0,20}保存/,
              /正常[^\\n]{0,20}(保存|登録)/
            ];

            const errorMessagePatterns = [
              /エラー/,
              /入力してください/,
              /必須項目/,
              /登録できません/,
              /保存できません/
            ];

            const hasSuccessMessage = successMessagePatterns.some(
              (pattern) => pattern.test(bodyText)
            );

            const hasErrorMessage = errorMessagePatterns.some(
              (pattern) => pattern.test(bodyText)
            );

            // 保存前画面には #form_id と下書きボタンが存在する。
            // POST後に一覧などへ遷移して両方消えた場合も成功候補とする。
            const leftEditForm = !form && !draftButton;

            return {
              url,
              hasForm: Boolean(form),
              hasDraftButton: Boolean(draftButton),
              hasSuccessMessage,
              hasErrorMessage,
              leftEditForm,
              bodyText: bodyText.slice(0, 4000)
            };
          })()
        `)

        if (result?.hasErrorMessage) {
          finish({
            ok: false,
            error: 'HUG側で下書き保存エラーを検出しました',
            url: result.url,
            responseText: result.bodyText,
          })
          return
        }

        if (result?.hasSuccessMessage || result?.leftEditForm) {
          finish({
            ok: true,
            message: '下書きを保存しました',
            url: result.url,
            responseText: result.bodyText,
          })
          return
        }

        finish({
          ok: false,
          error: '下書き保存の完了を確認できませんでした',
          url: result?.url,
          responseText: result?.bodyText,
        })
      } catch (error) {
        finish({
          ok: false,
          error: error?.message || String(error),
        })
      }
    }

    webview.addEventListener('did-stop-loading', handleStopLoading)
    webview.addEventListener('did-fail-load', handleFailLoad)

    try {
      const clickResult = await webview.executeJavaScript(`
        (() => {
          const button = document.querySelector(
            'button.draft.save[value="draft"]'
          );

          if (!button) {
            return {
              ok: false,
              error: '「下書きとして保存する」ボタンが見つかりません'
            };
          }

          button.click();

          return { ok: true };
        })()
      `)

      if (!clickResult?.ok) {
        finish({
          ok: false,
          error: clickResult?.error || '下書き保存ボタンを押せませんでした',
        })
        return
      }

      submitted = true
    } catch (error) {
      finish({
        ok: false,
        error: error?.message || String(error),
      })
    }
  })
}
