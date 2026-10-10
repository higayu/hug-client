# AttendanceTable

## 構成

```text
AttendanceTable/
├─ index.jsx
├─ components/
│  ├─ AttendanceHeader.jsx
│  ├─ AttendanceMessage.jsx
│  ├─ AttendanceDataTable.jsx
│  └─ AttendanceRow.jsx
├─ hooks/
│  └─ useSimpleAttendance.js
└─ services/
   └─ attendanceWebview.js
```

- `index.jsx`: 画面全体の組み立てだけを担当
- `components/`: 表示用Reactコンポーネント
- `hooks/`: state、定期更新、操作フローを担当
- `services/`: Electron WebView / HUG DOM 操作を担当
