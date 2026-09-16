import { Send } from 'lucide-react';

export default function ChatInput({ value, isLoading, onChange, onSend }) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat-input-area">
      <div className="chat-input-row">
        <textarea
          className="input-field"
          rows={2}
          style={{ flex: 1, minHeight: 'auto', resize: 'none', padding: '0.75rem' }}
          placeholder="質問や指示を入力..."
          value={value}
          disabled={isLoading}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '0 1rem', height: '42px', flexShrink: 0 }}
          onClick={onSend}
          disabled={isLoading}
        >
          <Send size={20} />
        </button>
      </div>
      <p className="chat-hint">Shift + Enter で改行、Enter で送信</p>
    </div>
  );
}
