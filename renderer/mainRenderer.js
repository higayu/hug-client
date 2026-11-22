// ===== モジュール読み込み =====
import { updateButtonVisibility } from "@/utils/app/buttonVisibility";
import { loadAllReload } from "@/utils/config/reloadSettings";
import {
  fetchAttendanceTableData,
  fetchAttendanceData,
  parseAttendanceTable,
} from "@/utils/ToDayChildrenList/attendanceTable";

// ============================================================
// グローバルにエクスポート（デバッグ・開発用）
// ============================================================
window.attendanceTableAPI = {
  fetchAttendanceTableData,
  fetchAttendanceData,
  parseAttendanceTable,
};

console.log("loaded mainRenderer.js");

window.addEventListener("DOMContentLoaded", async () => {
  console.log("DOMContentLoaded fired");
  console.log(
    "ℹ️ [mainRenderer] React側の useAppInitialization.js に初期化・終了確認処理を移行済み"
  );

  // ============================================================
  // ボタン表示を更新
  // ============================================================
  setTimeout(() => {
    console.log("🔄 [mainRenderer] updateButtonVisibility");
    updateButtonVisibility();
  }, 100);

  // ============================================================
  // 設定ファイルインポート後の再読み込み処理
  // ============================================================
  const importSettingButton = document.getElementById("Import-Setting");

  if (importSettingButton) {
    importSettingButton.addEventListener("click", async () => {
      try {
        console.log("🔄 [mainRenderer] config import START");

        const result = await window.electronAPI.importConfigFile();

        console.log("🔄 [mainRenderer] config import result:", result);

        if (result?.success) {
          const reloadOk = await loadAllReload();

          console.log("🔄 [mainRenderer] config import reload result:", {
            reloadOk,
            IniState: window.IniState,
          });

          if (reloadOk) {
            updateButtonVisibility();
            console.log("✅ [mainRenderer] config file imported and reloaded");
          }
        }
      } catch (err) {
        console.error("❌ [mainRenderer] config file import failed:", err);
      }
    });
  } else {
    console.warn("⚠️ [mainRenderer] Import-Setting button not found");
  }

  // ============================================================
  // ini.json の手動読み込み処理
  // ============================================================
  const loadIniButton = document.getElementById("Load-Ini");

  if (loadIniButton) {
    loadIniButton.addEventListener("click", async () => {
      try {
        console.log("🔄 [mainRenderer] manual ini reload START");

        const reloadOk = await loadAllReload();

        console.log("🔄 [mainRenderer] manual ini reload DONE:", {
          reloadOk,
          IniState: window.IniState,
          AppState: window.AppState,
        });

        if (reloadOk) {
          updateButtonVisibility();
          console.log("✅ [mainRenderer] ini.json manually loaded");
        }
      } catch (err) {
        console.error("❌ [mainRenderer] ini.json manually load failed:", err);
      }
    });
  } else {
    console.warn("⚠️ [mainRenderer] Load-Ini button not found");
  }

  // ============================================================
  // ドロップダウンメニューの位置を動的に計算する関数
  // ============================================================
  function positionDropdown(button, dropdown) {
    const rect = button.getBoundingClientRect();

    dropdown.style.position = "fixed";
    dropdown.style.top = rect.bottom + 5 + "px";
    dropdown.style.left = rect.left + "px";
    dropdown.style.zIndex = "99999";
  }

  // ============================================================
  // 設定ナビゲーション
  // ============================================================
  const panelBtn = document.getElementById("panel-btn");
  const panel = document.getElementById("panel");

  if (panelBtn && panel) {
    panelBtn.addEventListener("click", () => {
      panel.classList.toggle("open");

      if (panel.classList.contains("open")) {
        positionDropdown(panelBtn, panel);
      }
    });

    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== panelBtn) {
        panel.classList.remove("open");
      }
    });
  } else {
    console.warn("⚠️ [mainRenderer] panel or panel-btn not found");
  }

  // ============================================================
  // 一覧ナビゲーション
  // ============================================================
  const panelSupportBtn = document.getElementById("panel-support-btn");
  const panelSupport = document.getElementById("panel-support");

  if (panelSupportBtn && panelSupport) {
    panelSupportBtn.addEventListener("click", () => {
      panelSupport.classList.toggle("open");

      if (panelSupport.classList.contains("open")) {
        positionDropdown(panelSupportBtn, panelSupport);
      }
    });

    document.addEventListener("click", (e) => {
      if (!panelSupport.contains(e.target) && e.target !== panelSupportBtn) {
        panelSupport.classList.remove("open");
      }
    });
  } else {
    console.warn("⚠️ [mainRenderer] panel-support or panel-support-btn not found");
  }

  // ============================================================
  // 専門的支援加算ナビゲーション
  // ============================================================
  const panelSpecialBtn = document.getElementById("panel-special-btn");
  const panelSpecial = document.getElementById("panel-special");

  if (panelSpecialBtn && panelSpecial) {
    panelSpecialBtn.addEventListener("click", () => {
      panelSpecial.classList.toggle("open");

      if (panelSpecial.classList.contains("open")) {
        positionDropdown(panelSpecialBtn, panelSpecial);
      }
    });

    document.addEventListener("click", (e) => {
      if (!panelSpecial.contains(e.target) && e.target !== panelSpecialBtn) {
        panelSpecial.classList.remove("open");
      }
    });
  } else {
    console.warn("⚠️ [mainRenderer] panel-special or panel-special-btn not found");
  }

  // ============================================================
  // カスタムツールナビゲーション
  // ============================================================
  const customBtn = document.getElementById("custom-btn");
  const customPanel = document.getElementById("custom-panel");

  if (customBtn && customPanel) {
    customBtn.addEventListener("click", () => {
      customPanel.classList.toggle("open");

      if (customPanel.classList.contains("open")) {
        positionDropdown(customBtn, customPanel);
      }
    });

    document.addEventListener("click", (e) => {
      if (!customPanel.contains(e.target) && e.target !== customBtn) {
        customPanel.classList.remove("open");
      }
    });
  } else {
    console.warn("⚠️ [mainRenderer] custom-panel or custom-btn not found");
  }

  // ============================================================
  // ウィンドウリサイズ時にドロップダウンの位置を再計算
  // ============================================================
  window.addEventListener("resize", () => {
    if (panelBtn && panel && panel.classList.contains("open")) {
      positionDropdown(panelBtn, panel);
    }

    if (
      panelSupportBtn &&
      panelSupport &&
      panelSupport.classList.contains("open")
    ) {
      positionDropdown(panelSupportBtn, panelSupport);
    }

    if (
      panelSpecialBtn &&
      panelSpecial &&
      panelSpecial.classList.contains("open")
    ) {
      positionDropdown(panelSpecialBtn, panelSpecial);
    }

    if (customBtn && customPanel && customPanel.classList.contains("open")) {
      positionDropdown(customBtn, customPanel);
    }
  });

  console.log("✅ [mainRenderer] legacy DOM setup complete");
});