import { User } from 'lucide-react';
import CatBot from '../../../CatBot';

export default function MessageList({ messages, messagesEndRef }) {
  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      {messages.map((message) => {
        const isAi = message.sender === 'ai';

        return (
          <div
            key={message.id}
            className={`flex w-full items-end gap-2 ${
              isAi ? 'justify-start' : 'justify-end'
            }`}
          >
            {/* AIアイコン */}
            {isAi && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100">
                <CatBot className="h-6 w-6" />
              </div>
            )}

            {/* メッセージ */}
            <div
              className={`
                max-w-[75%]
                whitespace-pre-wrap
                break-words
                px-4
                py-2.5
                text-sm
                leading-relaxed
                shadow-sm
                ${
                  isAi
                    ? 'rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-800'
                    : 'rounded-2xl rounded-br-md bg-sky-600 text-white'
                }
              `}
            >
              {message.text}
            </div>

            {/* ユーザーアイコン */}
            {!isAi && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                <User size={20} />
              </div>
            )}
          </div>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
}