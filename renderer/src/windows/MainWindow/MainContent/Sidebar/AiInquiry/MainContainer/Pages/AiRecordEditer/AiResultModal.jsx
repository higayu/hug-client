import { X, RefreshCw, Check, ChevronDown, ChevronRight } from "lucide-react";
export default function AiResultModal({ activeTab, originalText, correctedText, additionalPrompt, expandedSections, onClose, onToggleSection, onChangeOriginalText, onChangeCorrectedText, onChangeAdditionalPrompt, onClear, onApplyAndClose, }) {
    return (<div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem",
        }}>
      <div className="card modal-content" style={{
            width: "100%",
            maxWidth: "800px",
            margin: 0,
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
        }}>
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ margin: 0 }}>校正結果の確認</h2>

          <button className="btn btn-secondary" style={{ padding: "0.25rem" }} onClick={onClose}>
            <X size={20}/>
          </button>
        </div>

        <div style={{
            overflowY: "auto",
            paddingRight: "0.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
        }}>
          {activeTab === "advanced" && (<>
              <div>
                <button className="flex justify-between items-center w-full" onClick={() => onToggleSection("original")} style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                marginBottom: "0.5rem",
            }}>
                  <label className="label" style={{ cursor: "pointer", margin: 0 }}>
                    校正前、元になった文章（編集可能）
                  </label>

                  {expandedSections.original ? (<ChevronDown size={16}/>) : (<ChevronRight size={16}/>)}
                </button>

                {expandedSections.original && (<textarea className="input-field" rows={3} value={originalText} onChange={(e) => onChangeOriginalText(e.target.value)} placeholder="校正前の文章が表示されます。必要に応じて編集できます。"/>)}
              </div>

              <div style={{
                backgroundColor: "var(--bg-color)",
                padding: "1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
            }}>
                <button className="flex justify-between items-center w-full" onClick={() => onToggleSection("systemPrompt")} style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                marginBottom: expandedSections.systemPrompt ? "0.5rem" : 0,
            }}>
                  <label className="label" style={{ cursor: "pointer", margin: 0 }}>
                    校正の仕方の指示プロンプト（編集不可）
                  </label>

                  {expandedSections.systemPrompt ? (<ChevronDown size={16}/>) : (<ChevronRight size={16}/>)}
                </button>

                {expandedSections.systemPrompt && (<p style={{
                    fontSize: "0.875rem",
                    color: "var(--text-light)",
                    margin: 0,
                }}>
                    放課後等デイサービスの支援記録について、以下の文章をF-SOAIPに沿った形式に校正してください。
                  </p>)}
              </div>

              <div>
                <button className="flex justify-between items-center w-full" onClick={() => onToggleSection("additionalPrompt")} style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                marginBottom: "0.5rem",
            }}>
                  <label className="label" style={{ cursor: "pointer", margin: 0 }}>
                    校正の仕方の指示追加プロンプト（編集可能）
                  </label>

                  {expandedSections.additionalPrompt ? (<ChevronDown size={16}/>) : (<ChevronRight size={16}/>)}
                </button>

                {expandedSections.additionalPrompt && (<textarea className="input-field" rows={2} value={additionalPrompt} onChange={(e) => onChangeAdditionalPrompt(e.target.value)} placeholder="例：保護者にも伝わりやすい表現にしてください。"/>)}
              </div>
            </>)}

          {activeTab === "simple" && (<div style={{
                backgroundColor: "var(--bg-color)",
                padding: "1rem",
                borderRadius: "var(--radius-md)",
            }}>
              <label className="label">元になった文章</label>
              <p style={{ margin: 0, fontSize: "0.875rem" }}>
                {originalText || "（未入力）"}
              </p>
            </div>)}

          <div>
            <button className="flex justify-between items-center w-full" onClick={() => onToggleSection("corrected")} style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            marginBottom: "0.5rem",
        }}>
              <label className="label" style={{ cursor: "pointer", margin: 0 }}>
                校正後の文章（編集可能）
              </label>

              {expandedSections.corrected ? (<ChevronDown size={16}/>) : (<ChevronRight size={16}/>)}
            </button>

            {expandedSections.corrected && (<textarea className="input-field" rows={8} value={correctedText} onChange={(e) => onChangeCorrectedText(e.target.value)} placeholder="AI校正後の文章が表示されます。必要に応じて編集できます。" style={{
                backgroundColor: "var(--primary-light)",
                borderColor: "var(--primary-color)",
            }}/>)}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4" style={{
            paddingTop: "1rem",
            borderTop: "1px solid var(--border-color)",
        }}>
          {activeTab === "advanced" && (<button className="btn btn-secondary" onClick={onClear}>
              クリア
            </button>)}

          <button className="btn btn-secondary" onClick={onClose}>
            キャンセル
          </button>

          <button className="btn btn-secondary">
            <RefreshCw size={18}/> 再校正
          </button>

          <button className="btn btn-primary" onClick={onApplyAndClose}>
            <Check size={18}/> 反映して閉じる
          </button>
        </div>
      </div>
    </div>);
}