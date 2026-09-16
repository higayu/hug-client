import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

export default function ChatPanel({
  facilityName,
  childName,
  messages,
  messagesEndRef,
  inputValue,
  isLoading,
  onBack,
  onInputChange,
  onSendMessage,
}) {
  return (
    <div className="card chat-container">
      <ChatHeader
        facilityName={facilityName}
        childName={childName}
        onBack={onBack}
      />
      <MessageList messages={messages} messagesEndRef={messagesEndRef} />
      <ChatInput value={inputValue} isLoading={isLoading} onChange={onInputChange} onSend={onSendMessage} />
    </div>
  );
}
