import { Save, History, PlayCircle, Settings } from 'lucide-react';
const DashboardPage = () => {
    return (<div className="w-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1>管理ダッシュボード</h1>
          <p style={{ color: 'var(--text-light)' }}>プロンプト管理とバッチ処理のステータスを確認します。</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="badge badge-primary">管理者モード</span>
        </div>
      </header>

      <div className="responsive-grid">
        
        {/* プロンプト管理セクション */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="flex items-center gap-2" style={{ margin: 0 }}><Settings size={20}/> 📊 AIプロンプト（解析用）</h3>
            </div>
            <textarea className="input-field mb-4" defaultValue="この児童のメンタル不調の傾向やデイを解約しそうな兆候がないか解析し、要約してください。"/>
            <div className="flex justify-end gap-2">
              <button className="btn btn-secondary"><History size={16}/> 変更履歴</button>
              <button className="btn btn-primary"><Save size={16}/> 保存</button>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="flex items-center gap-2" style={{ margin: 0 }}><Settings size={20}/> 📊 AIプロンプト（校正用）</h3>
            </div>
            <textarea className="input-field mb-4" defaultValue="放課後等デイサービスの支援記録について、以下の文章をF-SOAIPに沿った形式に校正してください。"/>
            <div className="flex justify-end gap-2">
              <button className="btn btn-secondary"><History size={16}/> 変更履歴</button>
              <button className="btn btn-primary"><Save size={16}/> 保存</button>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="flex items-center gap-2" style={{ margin: 0 }}><Settings size={20}/> 📊 AIプロンプト（問い合わせ用）</h3>
            </div>
            <textarea className="input-field mb-4" defaultValue="提供された過去の支援記録の事実のみに基づいて回答すること。推測で嘘をつかないこと。"/>
            <div className="flex justify-end gap-2">
              <button className="btn btn-secondary"><History size={16}/> 変更履歴</button>
              <button className="btn btn-primary"><Save size={16}/> 保存</button>
            </div>
          </div>

        </div>

        {/* 右側：コントロール＆ステータス */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <h3 className="mb-4">⚙️ バッチ処理コントロール</h3>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
              <div className="flex justify-between mb-2">
                <span className="label" style={{ margin: 0 }}>現在のステータス</span>
                <span className="badge badge-success">🟢 待機中</span>
              </div>
              <div className="flex justify-between">
                <span className="label" style={{ margin: 0 }}>前回の実行日時</span>
                <span style={{ fontSize: '0.875rem' }}>2026/03/01 02:00 (成功)</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="btn btn-primary" style={{ width: '100%' }}><PlayCircle size={18}/> バッチ起動</button>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4">📊 AI API 使用状況（今月）</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontWeight: 600 }}>Gemini 3.1 Pro</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>$12.50</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '40%', height: '100%', backgroundColor: 'var(--primary-color)' }}></div>
                </div>
              </div>
              
              <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontWeight: 600 }}>Gemini 3.1 Flash Lite</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary-color)' }}>$3.20</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '15%', height: '100%', backgroundColor: 'var(--secondary-color)' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>);
};
export default DashboardPage;