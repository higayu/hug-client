// src/utils/constants.js
// アプリケーション全体で使用する定数定義

// ==========================
// 🎨 カラーパレット
// ==========================
export const COLORS = {
  // 基本カラー
  PRIMARY: "#007bff",
  SUCCESS: "#28a745",
  WARNING: "#ffc107",
  DANGER: "#dc3545",
  INFO: "#17a2b8",
  SECONDARY: "#6c757d",
  PURPLE: "#6f42c1",
  
  // 背景色
  LIGHT: "#f8f9fa",
  WHITE: "#ffffff",
  DARK: "#343a40",
  
  // ボーダー色
  BORDER_LIGHT: "#dee2e6",
  BORDER_DARK: "#ced4da",
  
  // リスト用カラー
  WAITING_BG: "#fff3cd",
  WAITING_BORDER: "#ffeaa7",
  EXPERIENCE_BG: "#d1ecf1",
  EXPERIENCE_BORDER: "#bee5eb",
  
  // テキスト色
  TEXT_PRIMARY: "#333333",
  TEXT_SECONDARY: "#6c757d",
  TEXT_MUTED: "#495057",
  TEXT_WHITE: "#ffffff"
};

// ==========================
// 📅 曜日・日付関連
// ==========================
export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export const DATE_FORMATS = {
  YYYY_MM_DD: "YYYY-MM-DD",
  YYYY_MM_DD_HH_MM: "YYYY-MM-DD HH:mm",
  HH_MM: "HH:mm"
};

// ==========================
// 🎯 DOM要素のID
// ==========================
export const ELEMENT_IDS = {
  // メイン要素
  SETTINGS: "settings",
  CONFIG_OUTPUT: "configOutput",
  
  // 日付・曜日選択
  DATE_SELECT: "dateSelect",
  WEEKDAY_SELECT: "weekdaySelect",
  
  // リスト
  CHILDREN_LIST: "childrenList",
  WAITING_CHILDREN_LIST: "waitingChildrenList",
  EXPERIENCE_CHILDREN_LIST: "ExperienceChildrenList",
  
  // 施設・スタッフ選択
  FACILITY_SELECT: "facilitySelect",
  STAFF_SELECT: "staffSelect",
  
  // 折りたたみヘッダー
  CHILDREN_HEADER: "childrenHeader",
  WAITING_HEADER: "waitingHeader",
  
  // ボタン
  EDIT_SETTINGS: "Edit-Settings",
  CHECK_UPDATES_BTN: "checkUpdatesBtn",
  SHOW_UPDATE_INFO_BTN: "showUpdateInfoBtn",
  
  // タブ
  TABS_CONTAINER: "tabs",
  CONTENT: "content",
  KOJIN_BUTTON: "kojin-kiroku"
};

// ==========================
// 🎨 CSSクラス名
// ==========================
export const CSS_CLASSES = {
  // リスト関連
  ACTIVE: "active",
  SELECTED: "selected",
  WAITING_ITEM: "waiting-item",
  EXPERIENCE_ITEM: "experience-item",
  
  // 折りたたみ関連
  COLLAPSED: "collapsed",
  COLLAPSIBLE_SECTION: "collapsible-section",
  COLLAPSIBLE_HEADER: "collapsible-header",
  COLLAPSIBLE_CONTENT: "collapsible-content",
  TOGGLE_ICON: "toggle-icon",
  
  // 時間入力関連
  TIME_INPUT_CONTAINER: "time-input-container",
  TIME_GROUP: "time-group",
  TIME_LABEL: "time-label",
  TIME_INPUT: "time-input",
  MEMO_LABEL: "memo-label",
  MEMO_TEXTAREA: "memo-textarea",
  SAVE_BUTTON: "save-button",
  
  // ノート表示関連
  NOTES_DISPLAY: "notes-display",
  NOTES_CONTENT: "notes-content",
  
  // トースト関連
  TOAST: "toast",
  TOAST_SUCCESS: "toast-success",
  TOAST_ERROR: "toast-error",
  TOAST_WARNING: "toast-warning",
  TOAST_INFO: "toast-info"
};

// ==========================
// 📝 テキスト・メッセージ
// ==========================
export const MESSAGES = {
  // 成功メッセージ
  SUCCESS: {
    CONFIG_SAVED: "✅ config.json保存成功",
    INI_SAVED: "✅ ini.json保存成功",
    INI_LOADED: "✅ ini.json読み込み成功",
    CONFIG_LOADED: "✅ config.json 読み込み成功",
    CHILDREN_INIT: "✅ 子ども一覧 初期化完了",
    TEMP_NOTE_SAVED: "✅ 一時メモ保存成功",
    TEMP_NOTE_LOADED: "📖 一時メモ読み込み成功"
  },
  
  // エラーメッセージ
  ERROR: {
    CONFIG_SAVE: "❌ config.json保存エラー",
    CONFIG_LOAD: "❌ config.json 読み込み中にエラー",
    INI_SAVE: "❌ ini.json保存エラー",
    INI_LOAD: "❌ ini.json読み込みエラー",
    TEMP_NOTE_SAVE: "❌ 一時メモ保存エラー",
    TEMP_NOTE_LOAD: "❌ 一時メモ読み込みエラー",
    ELEMENT_NOT_FOUND: "❌ 要素取得に失敗しました"
  },
  
  // 情報メッセージ
  INFO: {
    NO_CHILDREN: "該当する子どもがいません",
    NO_WAITING: "キャンセル待ちの子どもはいません",
    NO_EXPERIENCE: "体験の子どもはいません",
    AUTO_SELECT: "✨ 自動選択",
    CHILD_SELECTED: "🎯 選択",
    DATE_CHANGED: "📅 日付変更",
    API_DATA: "Apiのdata:",
    TEMP_NOTE_NONE: "📖 一時メモなし"
  },
  
  // プレースホルダー
  PLACEHOLDERS: {
    MEMO: "一時的なメモを入力してください...",
    PASSWORD: "パスワードを入力してください"
  }
};

// ==========================
// ⚙️ 設定値
// ==========================
export const DEFAULTS = {
  // ウィンドウ設定
  WINDOW: {
    WIDTH: 1200,
    HEIGHT: 800,
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
    MAXIMIZED: false,
    ALWAYS_ON_TOP: false
  },
  
  // UI設定
  UI: {
    THEME: "light",
    LANGUAGE: "ja",
    SHOW_CLOSE_BUTTONS: true,
    CONFIRM_ON_CLOSE: true, // 追加: ウィンドウ閉じる時の確認
    AUTO_REFRESH: {
      ENABLED: false,
      INTERVAL: 30000
    }
  },
  
  // 通知設定
  NOTIFICATIONS: {
    ENABLED: true,
    SOUND: true,
    DESKTOP: true
  },
  
  // 折りたたみ設定
  COLLAPSIBLE: {
    MAX_HEIGHT: 200,
    TRANSITION_DURATION: 300
  }
};

// ==========================
// 🔧 機能設定
// ==========================
export const FEATURES = {
  ADDITION_COMPARE: {
    ENABLED: false,
    BUTTON_TEXT: "加算比較",
    BUTTON_COLOR: COLORS.WARNING
  },
  IMPORT_SETTING: {
    ENABLED: true,
    BUTTON_TEXT: "設定ファイル取得",
    BUTTON_COLOR: COLORS.SECONDARY
  },
  GET_URL: {
    ENABLED: true,
    BUTTON_TEXT: "URL取得",
    BUTTON_COLOR: COLORS.PURPLE
  },
  LOAD_INI: {
    ENABLED: true,
    BUTTON_TEXT: "ini.jsonの再読み込み",
    BUTTON_COLOR: COLORS.PURPLE
  }
};

// ==========================
// 🎨 スタイル設定
// ==========================
export const STYLES = {
  // 時間入力のスタイル
  TIME_INPUT: {
    WIDTH: "80px",
    PADDING: "4px 6px",
    FONT_SIZE: "11px"
  },
  
  // メモテキストエリアのスタイル
  MEMO_TEXTAREA: {
    MIN_HEIGHT: "60px",
    FONT_SIZE: "11px"
  },
  
  // ボタンのスタイル
  BUTTON: {
    SAVE: {
      PADDING: "4px 8px",
      FONT_SIZE: "10px"
    }
  }
};

// ==========================
// 🔄 イベント名
// ==========================
export const EVENTS = {
  CLICK: "click",
  CHANGE: "change",
  INPUT: "input",
  CONTEXTMENU: "contextmenu",
  LOAD: "load",
  ERROR: "error"
};

// ==========================
// 📁 ファイルパス
// ==========================
export const PATHS = {
  // modal.htmlとmodal.cssはReactコンポーネント（SettingsModal.jsx）に統合されました
};

