import { ArrowLeft } from 'lucide-react';

export default function ChatHeader({ facilityName, childName, onBack }) {
  return (
    <div className="chat-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '0.4rem', flexShrink: 0 }}
          onClick={onBack}
        >
          <ArrowLeft size={18} />
        </button>

        <h3 className="chat-header-title">
          {facilityName}：{childName}さん
        </h3>
      </div>
    </div>
  );
}
