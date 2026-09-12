// renderer/src/hooks/useTabs/actions/professionalNew.js

import { createWebview, createTabButton, activateTab, closeTab } from '../common/index.js'
import { confirmDialog } from '@/utils/dialog/confirmDialog.js'

export function addProfessionalSupportNewAction(appState, space) {
  if (!space?.childId) {
    alert('子どもを選択してください')
    return
  }

  const tabsContainer = document.getElementById('tabs')
  const webviewContainer = document.getElementById('webview-container')

  if (!tabsContainer || !webviewContainer) {
    console.error('❌ tabs または webview-container が見つかりません')
    return
  }

  const newId = `hugview-${appState.CURRENT_YMD}-${document.querySelectorAll('webview').length}`

  const newWebview = createWebview(
    newId,
    `https://www.hug-ayumu.link/hug/wm/record_proceedings.php?mode=edit`
  )

  webviewContainer.appendChild(newWebview)

  const tabButton = createTabButton(
    newId,
    `専門的加算 : ${space?.childName || space?.childId}`,
    appState.closeButtonsVisible
  )

  if (!tabButton) return

  tabsContainer.appendChild(tabButton)

  tabButton.addEventListener('click', () => activateTab(newId))

  const closeBtn = tabButton.querySelector('.close-btn')
  if (closeBtn) {
    closeBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      if (!(await confirmDialog('このタブを閉じますか？'))) return
      closeTab(newId)
    })
  }

  // --- 初回ロード処理 ---
  let initialized = false

  newWebview.addEventListener('did-finish-load', () => {
    if (initialized) return
    initialized = true

    // 日付を日本語へ変換
    const parts = appState.CURRENT_YMD.split('-')
    const jpDate = `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`

    // 開始終了時刻のパース
    const parseTime = (s) => {
      if (!s) return null
      const m = s.match(/^(\d{2}):(\d{2})$/)
      return m ? { h: String(parseInt(m[1])), m: String(parseInt(m[2])) } : null
    }

    const st = parseTime(space?.selectedChildColumn5)
    const et = parseTime(space?.selectedChildColumn6)

    newWebview.executeJavaScript(`
      try {
        // 専門的支援加算 (55)
        const support = document.querySelector('select[name="adding_children_id"]');
        if (support) {
          support.value = "55";
          support.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // 子ども選択
        const child = document.querySelector('select[name="c_id_list[0][id]"]');
        if (child) {
          child.value = "${space?.childId}";
          child.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // 記録者
        const recorder = document.querySelector('select[name="recorder"]');
        if (recorder) {
          recorder.value = "${appState.STAFF_ID}";
          recorder.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // 面接担当
        const interview = document.querySelector('select[name="interview_staff[]"]');
        if (interview) {
          interview.value = "${appState.STAFF_ID}";
          interview.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // タイトル
        const title = document.querySelector('input[name="customize[title][]"]');
        if (title) title.value = "記録";

        // 日付
        const dateInput = document.querySelector('input[name="interview_date"]') || document.getElementById('dp1');
        if (dateInput) {
          dateInput.value = "${jpDate}";
          dateInput.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // 時刻（開始）
        ${st ? `
        const sh = document.querySelector('#start_hour');
        if (sh && sh.querySelector('option[value="${st.h}"]')) sh.value = "${st.h}";
        const sm = document.querySelector('#start_time');
        if (sm && sm.querySelector('option[value="${st.m}"]')) sm.value = "${st.m}";
        ` : ''}

        // 時刻（終了）
        ${et ? `
        const eh = document.querySelector('#end_hour');
        if (eh && eh.querySelector('option[value="${et.h}"]')) eh.value = "${et.h}";
        const em = document.querySelector('#end_time');
        if (em && em.querySelector('option[value="${et.m}"]')) em.value = "${et.m}";
        ` : ''}

      } catch (e) {
        console.error("❌ 専門的支援-新規 初期化エラー:", e);
      }
    `)
  }, { once: true })

  activateTab(newId)
}

export function addProfessionalSupportCheckAction(appState, space) {
  if (!space?.childId) {
    alert('子どもを選択してください')
    return
  }

  const tabsContainer = document.getElementById('tabs')
  const webviewContainer = document.getElementById('webview-container')

  if (!tabsContainer || !webviewContainer) {
    console.error('❌ tabs または webview-container が見つかりません')
    return
  }

  const newId = `hugview-${appState.CURRENT_YMD}-${document.querySelectorAll('webview').length}`

  const newWebview = createWebview(
    newId,
    `https://www.hug-ayumu.link/hug/wm/record_proceedings.php?mode=edit`
  )

  webviewContainer.appendChild(newWebview)

  const tabButton = createTabButton(
    newId,
    `専門的加算 : ${space?.childName || space?.childId}`,
    appState.closeButtonsVisible
  )

  if (!tabButton) return

  tabsContainer.appendChild(tabButton)

  tabButton.addEventListener('click', () => activateTab(newId))

  const closeBtn = tabButton.querySelector('.close-btn')
  if (closeBtn) {
    closeBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      if (!(await confirmDialog('このタブを閉じますか？'))) return
      closeTab(newId)
    })
  }

  // --- 初回ロード処理 ---
  let initialized = false

  newWebview.addEventListener('did-finish-load', () => {
    if (initialized) return
    initialized = true

    // 日付を日本語へ変換
    const parts = appState.CURRENT_YMD.split('-')
    const jpDate = `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`

    // 開始終了時刻のパース
    const parseTime = (s) => {
      if (!s) return null
      const m = s.match(/^(\d{2}):(\d{2})$/)
      return m ? { h: String(parseInt(m[1])), m: String(parseInt(m[2])) } : null
    }

    const st = parseTime(space?.selectedChildColumn5)
    const et = parseTime(space?.selectedChildColumn6)

    newWebview.executeJavaScript(`
      try {
        // 専門的支援加算 (55)
        const support = document.querySelector('select[name="adding_children_id"]');
        if (support) {
          support.value = "55";
          support.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // 子ども選択
        const child = document.querySelector('select[name="c_id_list[0][id]"]');
        if (child) {
          child.value = "${space?.childId}";
          child.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // 記録者
        const recorder = document.querySelector('select[name="recorder"]');
        if (recorder) {
          recorder.value = "${appState.STAFF_ID}";
          recorder.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // 面接担当
        const interview = document.querySelector('select[name="interview_staff[]"]');
        if (interview) {
          interview.value = "${appState.STAFF_ID}";
          interview.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // タイトル
        const title = document.querySelector('input[name="customize[title][]"]');
        if (title) title.value = "記録";

        // 日付
        const dateInput = document.querySelector('input[name="interview_date"]') || document.getElementById('dp1');
        if (dateInput) {
          dateInput.value = "${jpDate}";
          dateInput.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // --- ここから追記：各種加算・議事録管理までスクロール ---
        setTimeout(() => {
          try {
            // <h3>各種加算・議事録管理</h3> を含む .ebox を探す
            const h3 = Array.from(document.querySelectorAll('.ebox h3'))
              .find(el => (el.textContent || '').trim() === '各種加算・議事録管理');

            const target = h3?.closest('.ebox');

            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              console.warn('⚠️ スクロール対象(.ebox > h3: 各種加算・議事録管理)が見つかりません');
            }
          } catch (e) {
            console.error('❌ スクロール処理エラー:', e);
          }
        }, 200);
        // --- 追記ここまで ---

      } catch (e) {
        console.error("❌ 専門的支援-新規 初期化エラー:", e);
      }
    `)
  }, { once: true })

  activateTab(newId)
}

export function addProfessionalSupportNewAction2(appState, space) {
  if (!space?.childId) {
    alert('子どもを選択してください')
    return
  }

  const tabsContainer = document.getElementById('tabs')
  const webviewContainer = document.getElementById('webview-container')

  if (!tabsContainer || !webviewContainer) {
    console.error('❌ tabs または webview-container が見つかりません')
    return
  }

  const newId = `hugview-${appState.CURRENT_YMD}-${document.querySelectorAll('webview').length}`

  const newWebview = createWebview(
    newId,
    `https://www.hug-ayumu.link/hug/wm/record_proceedings.php?mode=edit`
  )

  webviewContainer.appendChild(newWebview)

  const tabButton = createTabButton(
    newId,
    `専門的加算 : ${space?.childName || space?.childId}`,
    appState.closeButtonsVisible
  )

  if (!tabButton) return

  tabsContainer.appendChild(tabButton)

  tabButton.addEventListener('click', () => activateTab(newId))

  const closeBtn = tabButton.querySelector('.close-btn')
  if (closeBtn) {
    closeBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      if (!(await confirmDialog('このタブを閉じますか？'))) return
      closeTab(newId)
    })
  }

  // --- 初回ロード処理 ---
  let initialized = false

  newWebview.addEventListener('did-finish-load', () => {
    if (initialized) return
    initialized = true

    // 日付を日本語へ変換
    const parts = appState.CURRENT_YMD.split('-')
    const jpDate = `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`

    // 開始終了時刻のパース
    const parseTime = (s) => {
      if (!s) return null
      const m = s.match(/^(\d{2}):(\d{2})$/)
      return m ? { h: String(parseInt(m[1])), m: String(parseInt(m[2])) } : null
    }

    const st = parseTime(space?.selectedChildColumn5)
    const et = parseTime(space?.selectedChildColumn6)

  newWebview.executeJavaScript(`
    (function () {
      try {
        // ===============================
        // ① 既存の自動入力処理
        // ===============================

        const support = document.querySelector('select[name="adding_children_id"]');
        if (support) {
          support.value = "55";
          support.dispatchEvent(new Event("change", { bubbles: true }));
        }

        const child = document.querySelector('select[name="c_id_list[0][id]"]');
        if (child) {
          child.value = "${space?.childId}";
          child.dispatchEvent(new Event("change", { bubbles: true }));
        }

        const recorder = document.querySelector('select[name="recorder"]');
        if (recorder) {
          recorder.value = "${appState.STAFF_ID}";
          recorder.dispatchEvent(new Event("change", { bubbles: true }));
        }

        const interview = document.querySelector('select[name="interview_staff[]"]');
        if (interview) {
          interview.value = "${appState.STAFF_ID}";
          interview.dispatchEvent(new Event("change", { bubbles: true }));
        }

        const title = document.querySelector('input[name="customize[title][]"]');
        if (title) title.value = "記録";

        const dateInput =
          document.querySelector('input[name="interview_date"]') ||
          document.getElementById('dp1');
        if (dateInput) {
          dateInput.value = "${jpDate}";
          dateInput.dispatchEvent(new Event("change", { bubbles: true }));
        }

        ${st ? `
          const sh = document.querySelector('#start_hour');
          if (sh) sh.value = "${st.h}";
          const sm = document.querySelector('#start_time');
          if (sm) sm.value = "${st.m}";
        ` : ''}

        ${et ? `
          const eh = document.querySelector('#end_hour');
          if (eh) eh.value = "${et.h}";
          const em = document.querySelector('#end_time');
          if (em) em.value = "${et.m}";
        ` : ''}

        // ===============================
        // ② ボタン埋め込み処理
        // ===============================

        if (!document.getElementById("myAttendanceBtn")) {
          const btn = document.createElement("button");
          btn.id = "myAttendanceBtn";
          btn.innerText = "下書き保存";

          btn.style.position = "fixed";
          btn.style.top = "50%";
          btn.style.transform = "translate(-50%, -50%)";
          
          btn.style.padding = "10px 15px";
          btn.style.background = "#007bff";
          btn.style.color = "#fff";
          btn.style.border = "none";
          btn.style.borderRadius = "4px";
          btn.style.cursor = "pointer";
          btn.style.fontSize = "14px";
          btn.style.zIndex = "99999";

          btn.addEventListener("mouseenter", () => {
            btn.style.background = "#0056b3";
          });
          btn.addEventListener("mouseleave", () => {
            btn.style.background = "#007bff";
          });

          btn.addEventListener("click", () => {
            try {
              // 「下書きとして保存する」ボタンを取得
              const draftBtn = document.querySelector(
                'button.save[value="draft"]'
              );

              if (draftBtn) {
                // 既存の click ハンドラをそのまま実行
                draftBtn.click();
              } else {
                console.error("❌ 下書き保存ボタンが見つかりません");
              }
            } catch (e) {
              console.error("❌ 下書き保存実行エラー:", e);
            }
          });


          document.body.appendChild(btn);
        }

      } catch (e) {
        console.error("❌ 初期化＋ボタン埋め込みエラー:", e);
      }
    })();
  `);

  }, { once: true })

  activateTab(newId)
}

// ============================================
// addProfessionalSupportNewAction3（修正版 - 改行対応 + 初期値設定 + サイズ調整）
// ============================================
export function addProfessionalSupportNewAction3(appState, space) {
  if (!space?.childId) {
    alert('子どもを選択してください')
    return
  }

  const tabsContainer = document.getElementById('tabs')
  const webviewContainer = document.getElementById('webview-container')

  if (!tabsContainer || !webviewContainer) {
    console.error('❌ tabs または webview-container が見つかりません')
    return
  }

  const newId = `hugview-${appState.CURRENT_YMD}-${document.querySelectorAll('webview').length}`

  const newWebview = createWebview(
    newId,
    `https://www.hug-ayumu.link/hug/wm/record_proceedings.php?mode=edit`
  )

  webviewContainer.appendChild(newWebview)

  const tabButton = createTabButton(
    newId,
    `専門的加算 : ${space?.childName || space?.childId}`,
    appState.closeButtonsVisible
  )

  if (!tabButton) return

  tabsContainer.appendChild(tabButton)

  tabButton.addEventListener('click', () => activateTab(newId))

  const closeBtn = tabButton.querySelector('.close-btn')
  if (closeBtn) {
    closeBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      if (!(await confirmDialog('このタブを閉じますか？'))) return
      closeTab(newId)
    })
  }

  // --- 初回ロード処理 ---
  let initialized = false

  newWebview.addEventListener('did-finish-load', () => {
    if (initialized) return
    initialized = true

    // 日付を日本語へ変換
    const parts = appState.CURRENT_YMD.split('-')
    const jpDate = `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`

    // 開始終了時刻のパース
    const parseTime = (s) => {
      if (!s) return null
      const m = s.match(/^(\d{2}):(\d{2})$/)
      return m ? { h: String(parseInt(m[1])), m: String(parseInt(m[2])) } : null
    }

    const st = parseTime(space?.selectedChildColumn5)
    const et = parseTime(space?.selectedChildColumn6)

  newWebview.executeJavaScript(`
    (function () {
      try {
        // ===============================
        // ① 既存の自動入力処理
        // ===============================

        const support = document.querySelector('select[name="adding_children_id"]');
        if (support) {
          support.value = "55";
          support.dispatchEvent(new Event("change", { bubbles: true }));
        }

        const child = document.querySelector('select[name="c_id_list[0][id]"]');
        if (child) {
          child.value = "${space?.childId}";
          child.dispatchEvent(new Event("change", { bubbles: true }));
        }

        const recorder = document.querySelector('select[name="recorder"]');
        if (recorder) {
          recorder.value = "${appState.STAFF_ID}";
          recorder.dispatchEvent(new Event("change", { bubbles: true }));
        }

        const interview = document.querySelector('select[name="interview_staff[]"]');
        if (interview) {
          interview.value = "${appState.STAFF_ID}";
          interview.dispatchEvent(new Event("change", { bubbles: true }));
        }

        const title = document.querySelector('input[name="customize[title][]"]');
        if (title) title.value = "記録";

        const dateInput =
          document.querySelector('input[name="interview_date"]') ||
          document.getElementById('dp1');
        if (dateInput) {
          dateInput.value = "${jpDate}";
          dateInput.dispatchEvent(new Event("change", { bubbles: true }));
        }

        ${st ? `
          const sh = document.querySelector('#start_hour');
          if (sh) sh.value = "${st.h}";
          const sm = document.querySelector('#start_time');
          if (sm) sm.value = "${st.m}";
        ` : ''}

        ${et ? `
          const eh = document.querySelector('#end_hour');
          if (eh) eh.value = "${et.h}";
          const em = document.querySelector('#end_time');
          if (em) em.value = "${et.m}";
        ` : ''}

        // ===============================
        // ② content.jsスタイルのボタン埋め込み処理（改行対応 + 初期値設定 + サイズ調整）
        // ===============================

        // ============================================
        // 共通関数: 要素にスクロール移動
        // ============================================
        function scrollToElement(element) {
          if (!element) {
            console.warn("[スクロール] 要素がありません");
            return false;
          }
          
          try {
            const rect = element.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
            const targetPosition = rect.top + scrollTop - 150;
            
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
            
            setTimeout(() => {
              window.scrollTo(0, targetPosition);
            }, 100);
            
            setTimeout(() => {
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
              });
            }, 200);
            
            return true;
          } catch (error) {
            console.error("[スクロール] エラー:", error);
            return false;
          }
        }

        // ============================================
        // 共通関数: 要素をハイライト表示
        // ============================================
        function highlightElement(element) {
          if (!element) return;
          
          const originalBackground = element.style.backgroundColor;
          const originalOutline = element.style.outline;
          const originalTransition = element.style.transition;
          
          element.style.transition = 'all 0.3s ease';
          element.style.backgroundColor = '#ffff99';
          element.style.outline = '3px solid #ff6b6b';
          
          setTimeout(() => {
            element.style.backgroundColor = originalBackground || '';
            element.style.outline = originalOutline || '';
            setTimeout(() => {
              element.style.transition = originalTransition || '';
            }, 300);
          }, 3000);
        }

        // ============================================
        // 改良版: クリップボードからテキストを読み取る関数（webview対応 + 初期値設定 + 改行対応）
        // ============================================
        async function getClipboardText(targetTextarea) {
          // 方法1: 標準のクリップボードAPI
          try {
            if (navigator.clipboard && navigator.clipboard.readText) {
              const text = await navigator.clipboard.readText();
              if (text && text.length > 0) {
                console.log("✅ クリップボードAPIで読み取り成功");
                return text;
              }
            }
          } catch (apiError) {
            console.warn("⚠️ クリップボードAPI失敗:", apiError.message);
          }

          // 方法2: execCommand（webviewで動作することが多い）
          try {
            const textarea = document.createElement('textarea');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            textarea.style.left = '-9999px';
            textarea.style.top = '-9999px';
            document.body.appendChild(textarea);
            
            const activeElement = document.activeElement;
            textarea.focus();
            
            const success = document.execCommand('paste');
            
            if (success) {
              const text = textarea.value;
              document.body.removeChild(textarea);
              if (activeElement) activeElement.focus();
              if (text && text.length > 0) {
                console.log("✅ execCommandで読み取り成功");
                return text;
              }
            }
            
            document.body.removeChild(textarea);
            if (activeElement) activeElement.focus();
            console.warn("⚠️ execCommandでの貼り付けに失敗");
          } catch (execError) {
            console.warn("⚠️ execCommandエラー:", execError.message);
          }

          // 方法3: 手動入力ダイアログ（最終手段）- 初期値付き + 改行対応
          console.warn("⚠️ 自動読み取りができないため、手動入力を促します");
          return new Promise((resolve) => {
            // 既存の値を取得（初期値用）
            let existingValue = '';
            if (targetTextarea) {
              existingValue = targetTextarea.value || '';
              console.log("📝 既存の値を初期値として設定:", existingValue.substring(0, 50) + (existingValue.length > 50 ? "..." : ""));
            }

            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
            overlay.style.zIndex = '9999999';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            const dialog = document.createElement('div');
            dialog.style.backgroundColor = 'white';
            dialog.style.padding = '30px';
            dialog.style.borderRadius = '10px';
            dialog.style.maxWidth = '600px';
            dialog.style.width = '90%';
            dialog.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';

            const existingValueMessage = existingValue 
              ? \`<p style="color: #4CAF50; font-size: 13px; margin: 5px 0 10px 0;">
                  ✅ 現在の値が初期設定されています（編集可能です）
                 </p>\`
              : \`<p style="color: #999; font-size: 13px; margin: 5px 0 10px 0;">
                  💡 現在の値は空です
                 </p>\`;

            dialog.innerHTML = \`
              <h3 style="margin-top: 0; color: #333;">📋 クリップボードの内容を貼り付けてください</h3>
              <p style="color: #666; font-size: 14px;">自動読み取りに失敗しました。手動で貼り付けてください。</p>
              \${existingValueMessage}
              <textarea id="manualPasteTextarea" style="
                width: 100%;
                height: 200px;
                padding: 10px;
                border: 2px solid \${existingValue ? '#4CAF50' : '#ccc'};
                border-radius: 5px;
                font-size: 14px;
                font-family: inherit;
                box-sizing: border-box;
                resize: vertical;
              " placeholder="ここにテキストを貼り付けてください (Ctrl+V / ⌘V)">\${existingValue}</textarea>
              <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end;">
                <button id="manualPasteCancel" style="
                  padding: 10px 20px;
                  border: 1px solid #ccc;
                  border-radius: 5px;
                  background: white;
                  cursor: pointer;
                  font-size: 14px;
                ">キャンセル</button>
                <button id="manualPasteClear" style="
                  padding: 10px 20px;
                  border: 1px solid #f44336;
                  border-radius: 5px;
                  background: white;
                  color: #f44336;
                  cursor: pointer;
                  font-size: 14px;
                ">🗑️ クリア</button>
                <button id="manualPasteConfirm" style="
                  padding: 10px 20px;
                  border: none;
                  border-radius: 5px;
                  background: #4CAF50;
                  color: white;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: bold;
                ">✅ 貼り付け</button>
              </div>
            \`;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            const textarea = dialog.querySelector('#manualPasteTextarea');
            const confirmBtn = dialog.querySelector('#manualPasteConfirm');
            const cancelBtn = dialog.querySelector('#manualPasteCancel');
            const clearBtn = dialog.querySelector('#manualPasteClear');

            // テキストエリアにフォーカス
            setTimeout(() => {
              textarea.focus();
              if (existingValue) {
                textarea.select();
              }
            }, 100);

            // クリアボタン
            clearBtn.addEventListener('click', () => {
              textarea.value = '';
              textarea.focus();
              console.log("🗑️ テキストをクリアしました");
            });

            // 確認ボタン
            confirmBtn.addEventListener('click', () => {
              const text = textarea.value;
              document.body.removeChild(overlay);
              resolve(text && text.trim().length > 0 ? text : null);
            });

            // キャンセルボタン
            cancelBtn.addEventListener('click', () => {
              document.body.removeChild(overlay);
              resolve(null);
            });

            // ★ 修正ポイント: Enterキーの処理（改行を許可）
            textarea.addEventListener('keydown', (e) => {
              // Ctrl+Enter または Cmd+Enter の場合のみ確定（改行を防止）
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                confirmBtn.click();
                return;
              }
              
              // Escape でキャンセル
              if (e.key === 'Escape') {
                e.preventDefault();
                cancelBtn.click();
                return;
              }
              
              // 通常の Enter は何もしない → デフォルトの改行動作が実行される
              // ★ e.preventDefault() を呼ばないことが重要！
            });
          });
        }

        // ============================================
        // 1. 自由項目貼り付けボタン（📋）- サイズ調整版 + 初期値設定対応 + 改行対応
        // ============================================
        (function createPasteButton() {
          const existingPasteBtn = document.getElementById("customizePasteBtn");
          if (existingPasteBtn) {
            existingPasteBtn.remove();
            console.log("🗑️ 既存の貼り付けボタンを削除しました");
          }

          const pasteBtn = document.createElement("button");
          pasteBtn.id = "customizePasteBtn";
          pasteBtn.innerText = "📋 入力";
          
          // サイズ調整済みスタイル
          pasteBtn.style.position = "fixed";
          pasteBtn.style.top = "50%";
          pasteBtn.style.right = "180px";
          pasteBtn.style.transform = "translateY(-50%)";
          pasteBtn.style.zIndex = "999999";
          pasteBtn.style.padding = "10px 18px";
          pasteBtn.style.color = "white";
          pasteBtn.style.fontSize = "14px";
          pasteBtn.style.fontWeight = "bold";
          pasteBtn.style.border = "none";
          pasteBtn.style.borderRadius = "8px";
          pasteBtn.style.cursor = "pointer";
          pasteBtn.style.boxShadow = "0 3px 12px rgba(0,0,0,0.3)";
          pasteBtn.style.transition = "all 0.3s ease";
          pasteBtn.style.letterSpacing = "0.5px";
          pasteBtn.style.backgroundColor = "#4CAF50";
          pasteBtn.style.whiteSpace = "nowrap";

          pasteBtn.addEventListener("mouseenter", () => {
            pasteBtn.style.transform = "translateY(-50%) scale(1.05)";
            pasteBtn.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
          });
          pasteBtn.addEventListener("mouseleave", () => {
            pasteBtn.style.transform = "translateY(-50%) scale(1)";
            pasteBtn.style.boxShadow = "0 3px 12px rgba(0,0,0,0.3)";
          });

          pasteBtn.addEventListener("click", async function() {
            console.log("📋 自由項目貼り付けボタンがクリックされました");
            
            this.style.backgroundColor = "#FF9800";
            this.innerText = "⏳ 貼り付け中...";
            this.style.transform = "translateY(-50%) scale(0.95)";
            
            try {
              // 貼り付け先のテキストエリアを先に取得
              const textarea = document.querySelector('textarea[name="customize[contents][]"]');
              
              if (!textarea) {
                console.error("❌ 自由項目テキストエリアが見つかりません");
                this.style.backgroundColor = "#f44336";
                this.innerText = "❌ エラー";
                setTimeout(() => {
                  this.style.backgroundColor = "#4CAF50";
                  this.innerText = "📋 自由項目貼り付け";
                  this.style.transform = "translateY(-50%) scale(1)";
                }, 2000);
                return;
              }

              // ★ テキストエリアを引数として渡す（初期値取得のため）
              const clipboardText = await getClipboardText(textarea);
              
              if (!clipboardText || clipboardText.trim().length === 0) {
                console.error("❌ 貼り付け内容が空です");
                this.style.backgroundColor = "#f44336";
                this.innerText = "❌ 空です";
                setTimeout(() => {
                  this.style.backgroundColor = "#4CAF50";
                  this.innerText = "📋 入力";
                  this.style.transform = "translateY(-50%) scale(1)";
                }, 2000);
                return;
              }

              scrollToElement(textarea);
              
              textarea.value = clipboardText;
              textarea.dispatchEvent(new Event('input', { bubbles: true }));
              textarea.dispatchEvent(new Event('change', { bubbles: true }));
              
              highlightElement(textarea);
              textarea.focus();
              
              console.log("✅ 自由項目にテキストを貼り付けました");
              this.style.backgroundColor = "#4CAF50";
              this.innerText = "✅ 完了！";
              setTimeout(() => {
                this.style.backgroundColor = "#4CAF50";
                this.innerText = "📋 入力";
                this.style.transform = "translateY(-50%) scale(1)";
              }, 2000);

            } catch (error) {
              console.error("❌ 貼り付けエラー:", error);
              this.style.backgroundColor = "#f44336";
              this.innerText = "❌ エラー";
              setTimeout(() => {
                this.style.backgroundColor = "#4CAF50";
                this.innerText = "📋 入力";
                this.style.transform = "translateY(-50%) scale(1)";
              }, 2000);
            }
          });

          document.body.appendChild(pasteBtn);
          console.log("✅ 自由項目貼り付けボタン生成完了（サイズ調整版 + 初期値設定対応 + 改行対応）");
        })();

        // ============================================
        // 2. 専門的加算 下書き保存ボタン（💾）- サイズ調整版
        // ============================================
        (function createDraftButton() {
          const existingDraftBtn = document.getElementById("professionalDraftBtn");
          if (existingDraftBtn) {
            existingDraftBtn.remove();
            console.log("🗑️ 既存の下書き保存ボタンを削除しました");
          }

          const draftBtn = document.createElement("button");
          draftBtn.id = "professionalDraftBtn";
          draftBtn.innerText = "💾 下書き保存";
          
          // サイズ調整済みスタイル
          draftBtn.style.position = "fixed";
          draftBtn.style.top = "50%";
          draftBtn.style.right = "20px";
          draftBtn.style.transform = "translateY(-50%)";
          draftBtn.style.zIndex = "999999";
          draftBtn.style.padding = "10px 18px";
          draftBtn.style.color = "white";
          draftBtn.style.fontSize = "14px";
          draftBtn.style.fontWeight = "bold";
          draftBtn.style.border = "none";
          draftBtn.style.borderRadius = "8px";
          draftBtn.style.cursor = "pointer";
          draftBtn.style.boxShadow = "0 3px 12px rgba(0,0,0,0.3)";
          draftBtn.style.transition = "all 0.3s ease";
          draftBtn.style.letterSpacing = "0.5px";
          draftBtn.style.backgroundColor = "#9C27B0";
          draftBtn.style.whiteSpace = "nowrap";

          draftBtn.addEventListener("mouseenter", () => {
            draftBtn.style.transform = "translateY(-50%) scale(1.05)";
            draftBtn.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
          });
          draftBtn.addEventListener("mouseleave", () => {
            draftBtn.style.transform = "translateY(-50%) scale(1)";
            draftBtn.style.boxShadow = "0 3px 12px rgba(0,0,0,0.3)";
          });

          draftBtn.addEventListener("click", function() {
            console.log("💾 専門的加算 下書き保存ボタンがクリックされました");
            
            this.style.backgroundColor = "#FF9800";
            this.innerText = "⏳ 保存中...";
            this.style.transform = "translateY(-50%) scale(0.95)";
            
            try {
              let saveButton = document.querySelector('button.save[value="draft"]');
              
              if (!saveButton) {
                saveButton = document.querySelector('button[data-save-button][value="1"]');
              }
              
              if (!saveButton) {
                saveButton = document.querySelector('button.btn.btn-sm.draft[data-save-button=""]');
              }
              
              if (!saveButton) {
                const allButtons = document.querySelectorAll('button');
                for (const btn of allButtons) {
                  const text = btn.textContent || '';
                  if (text.includes('下書き') || 
                      text.includes('draft') ||
                      text.includes('下書き保存')) {
                    saveButton = btn;
                    break;
                  }
                }
              }
              
              if (!saveButton) {
                console.error("❌ 下書き保存ボタンが見つかりません");
                this.style.backgroundColor = "#f44336";
                this.innerText = "❌ エラー";
                setTimeout(() => {
                  this.style.backgroundColor = "#9C27B0";
                  this.innerText = "💾 専門的加算保存";
                  this.style.transform = "translateY(-50%) scale(1)";
                }, 2000);
                return;
              }

              console.log("✅ 下書き保存ボタンを発見:", saveButton);
              
              scrollToElement(saveButton);
              highlightElement(saveButton);

              setTimeout(() => {
                try {
                  saveButton.click();
                  console.log("✅ 標準クリック実行");
                } catch (e) {
                  console.warn("⚠️ 標準クリック失敗:", e);
                  try {
                    const clickEvent = new MouseEvent('click', {
                      view: window,
                      bubbles: true,
                      cancelable: true
                    });
                    saveButton.dispatchEvent(clickEvent);
                    console.log("✅ dispatchEventクリック実行");
                  } catch (e2) {
                    console.error("❌ すべてのクリック方法が失敗:", e2);
                  }
                }
                
                this.style.backgroundColor = "#4CAF50";
                this.innerText = "✅ 保存完了！";
                setTimeout(() => {
                  this.style.backgroundColor = "#9C27B0";
                  this.innerText = "💾 専門的加算保存";
                  this.style.transform = "translateY(-50%) scale(1)";
                }, 2500);
              }, 500);

            } catch (error) {
              console.error("❌ 下書き保存エラー:", error);
              this.style.backgroundColor = "#f44336";
              this.innerText = "❌ エラー";
              setTimeout(() => {
                this.style.backgroundColor = "#9C27B0";
                this.innerText = "💾 専門的加算保存";
                this.style.transform = "translateY(-50%) scale(1)";
              }, 2000);
            }
          });

          document.body.appendChild(draftBtn);
          console.log("✅ 専門的加算 下書き保存ボタン生成完了（サイズ調整版）");
        })();

        // ===============================
        // ③ デバッグ情報
        // ===============================
        console.log("=== ボタン生成完了（サイズ調整版 + 初期値設定対応 + 改行対応） ===");
        console.log("📋 自由項目貼り付けボタン: 右から180px（サイズ: 10px 18px, 14px）");
        console.log("💾 専門的加算保存ボタン: 右から20px（サイズ: 10px 18px, 14px）");
        console.log("自由項目テキストエリアの有無:", 
          document.querySelector('textarea[name="customize[contents][]"]') ? "あり" : "なし"
        );
        console.log("下書き保存ボタンの有無:", 
          document.querySelector('button.save[value="draft"]') ? "あり" : "なし"
        );

      } catch (e) {
        console.error("❌ 初期化＋ボタン埋め込みエラー:", e);
      }
    })();
  `);

  }, { once: true })

  activateTab(newId)
}

