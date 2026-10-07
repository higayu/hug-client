# ProfessionalSupportManagerPanel 共通化

- ProfessionalSupportManagerPanel から spaceId / selectActiveSpaceId / selectSpaceChildId / chilledSpaces 依存を削除。
- facilityId / currentYmd / selectedChildId / selectedChildName / enterTime / leaveTime を props で受け取る形へ変更。
- 専門的支援一覧を開く処理は onOpenProfessionalSupportList callback で親側から渡す。
- useProfessionalSupportStatusCheck も spaceId 依存を削除し、childId / facilityId / currentYmd を引数で受け取る形へ変更。
- CheckPanels と 2 系統の ProfessionalPrompt1 は、外側で spaceId から状態を取得して Panel2 へ props で渡すよう変更。
- SimpleBoard/AttendanceRow は旧 ProfessionalSupportCheckPanel から ProfessionalSupportManagerPanel へ置換。
- SimpleBoard の一覧表示機能を維持するため、旧一覧 helper を ProfessionalSupportManagerPanel/professionalList.js へ移動。
- ProfessionalSupportCheckPanel ディレクトリと export を削除。
- DB駆動処理 professionalSupportWebAutomation.js / postProfessionalSupportDraft.js の処理内容は変更していない。
