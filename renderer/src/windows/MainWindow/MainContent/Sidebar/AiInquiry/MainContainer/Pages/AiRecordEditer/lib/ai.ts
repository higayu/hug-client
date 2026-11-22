import { fetchJson } from './fetchJson';
import { getAiSettings } from './aiConfig';

export const CORRECTION_SYSTEM_PROMPT =
  'あなたは児童支援記録の校正アシスタントです。入力された記録を【S】【O】【A】【P】形式（状況・観察・評価・計画）で整理・校正し、日本語で出力してください。';

export const CHAT_SYSTEM_PROMPT =
  'あなたは児童支援記録の分析アシスタントです。提供された支援記録をもとに、職員の質問に丁寧に答えてください。';

type AiMessage = { role: string; content: string };

async function callOllama(messages: AiMessage[], model: string, baseUrl: string) {
  const data = await fetchJson<{ message?: { content?: string } }>(
    `${baseUrl}/api/chat`,
    {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
    },
  );

  const text = data?.message?.content;
  if (!text) throw new Error('Ollama からの応答が空です');
  return text;
}

async function callGemini(messages: AiMessage[], model: string, apiKey: string) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY が設定されていません（.env の VITE_GEMINI_API_KEY を確認）');
  }

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemMsg = messages.find((m) => m.role === 'system');
  if (systemMsg && contents.length > 0) {
    contents[0].parts[0].text = `${systemMsg.content}\n\n${contents[0].parts[0].text}`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const data = await fetchJson<{
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  }>(url, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini からの応答が空です');
  return text;
}

export async function callAi(messages: AiMessage[]) {
  const { provider, model, ollamaBaseUrl, geminiApiKey } = getAiSettings();
  console.log(`[AI] provider=${provider}, model=${model}`);

  if (provider === 'gemini') {
    return callGemini(messages, model, geminiApiKey);
  }

  return callOllama(messages, model, ollamaBaseUrl);
}

export async function callAiRecordEditer(payload: {
  prompt: string;
  message: string;
}) {
  const api = (window as any)?.electronAPI;

  if (typeof api?.laravel_ai_record_editer_correct !== 'function') {
    throw new Error(
      'AiRecordEditer用のElectron APIが利用できません。preload/mainの実装を確認してください。',
    );
  }

  const result = await api.laravel_ai_record_editer_correct({
    prompt: payload.prompt,
    message: payload.message,
  });

  if (!result || result.success === false) {
    throw new Error(
      result?.error?.message ||
        result?.message ||
        'AI校正APIの呼び出しに失敗しました。',
    );
  }

  const responseData = result?.data ?? result;

  if (responseData?.success === false) {
    throw new Error(
      responseData?.message ||
        'Laravel側のAI校正処理に失敗しました。',
    );
  }

  const text = responseData?.message;

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('AI校正結果が空です。');
  }

  return text.trim();
}

export function buildCorrectionMessage(correction: {
  originalText: string;
  additionalPrompt: string;
}) {
  const userParts = [`【原文】\n${correction.originalText}`];

  if (correction.additionalPrompt.trim()) {
    userParts.push(`【追加指示】\n${correction.additionalPrompt}`);
  }

  return userParts.join('\n\n');
}

export function buildCorrectionMessages(correction: {
  systemPrompt: string;
  originalText: string;
  additionalPrompt: string;
}) {
  const userParts = [`【原文】\n${correction.originalText}`];

  if (correction.additionalPrompt.trim()) {
    userParts.push(`【追加指示】\n${correction.additionalPrompt}`);
  }

  return [
    { role: 'system', content: correction.systemPrompt },
    { role: 'user', content: userParts.join('\n\n') },
  ];
}

export function buildChatMessages(chat: {
  childName: string;
  startDate: string;
  endDate: string;
  records: { target_date?: string; content: string }[];
  messages: { sender: string; text: string }[];
}) {
  const recordsText =
    chat.records.length > 0
      ? chat.records
          .map((r) => {
            const dateStr = r.target_date ? r.target_date.split('T')[0] : '不明';
            return `- ${dateStr}: ${r.content}`;
          })
          .join('\n')
      : '（記録なし）';

  const systemContent = `${CHAT_SYSTEM_PROMPT}\n\n児童名: ${chat.childName}さん\n期間: ${chat.startDate} 〜 ${chat.endDate}\n\n【支援記録】\n${recordsText}`;

  const messages: AiMessage[] = [{ role: 'system', content: systemContent }];

  chat.messages.forEach((msg) => {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    });
  });

  return messages;
}