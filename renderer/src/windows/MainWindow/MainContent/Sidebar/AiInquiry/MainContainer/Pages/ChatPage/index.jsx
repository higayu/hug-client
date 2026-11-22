import { useEffect, useMemo, useRef, useState } from 'react';
import CatBot from './CatBot';
import ChatPanel from './components/ChatPanel';
import {
  getDefaultPeriod,
} from './utils/chatUtils';
import { useAppState } from '@/AppStateContext';
import { useServiceRecord } from '@/hooks/useServiceRecord';
import SelectionPanel from './SelectionPanel';

const getFacilityId = (facility) => facility?.facility_id ?? facility?.id ?? null;
const getChildId = (child) => child?.child_id ?? child?.children_id ?? child?.id ?? null;
const getRecordChildId = (record) => record?.child_id ?? record?.children_id ?? null;
const getRecordDate = (record) =>
  record?.target_date ??
  record?.served_date ??
  record?.record_date ??
  record?.service_date ??
  record?.date ??
  null;
const getRecordContent = (record) =>
  record?.content ??
  record?.note ??
  record?.body ??
  record?.text ??
  '';
const isActiveChild = (child) => Number(child?.is_delete ?? 0) !== 1;
const sameId = (left, right) => String(left) === String(right);
const toTable = (value) => (Array.isArray(value) ? value : []);
const getTargetMonths = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return [];
  }

  const start = new Date(`${startDate.slice(0, 7)}-01T00:00:00`);
  const end = new Date(`${endDate.slice(0, 7)}-01T00:00:00`);
  const months = [];

  for (
    const cursor = new Date(start);
    cursor <= end;
    cursor.setMonth(cursor.getMonth() + 1)
  ) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
  }

  return months;
};
const buildAiPrompt = ({
  userText,
  facilityName,
  childName,
  startDate,
  endDate,
  records,
}) => {
  const recordsText =
    records.length > 0
      ? records
          .slice(0, 30)
          .map((record) => {
            const dateStr = record.target_date
              ? record.target_date.split('T')[0]
              : '不明';

            return `- ${dateStr}: ${record.content}`;
          })
          .join('\n')
      : '該当する支援記録はありません。';

  return [
    `対象施設: ${facilityName ?? '未選択'}`,
    `対象児童: ${childName ?? '未選択'}`,
    `対象期間: ${startDate} ～ ${endDate}`,
    '',
    '支援記録:',
    recordsText,
    '',
    '質問:',
    userText,
  ].join('\n');
};

export default function ChatPage({
  initialFacilityId = null,
  initialChildId = null,
  onFacilityChange = null,
  onChildChange = null,
  className = '',
}) {
  const defaults = getDefaultPeriod();

  const { databaseState, iniState } = useAppState();
  const configuredFacilityId = iniState?.apiSettings?.facilityId ?? null;

  const facilities = toTable(databaseState?.facilitys);
  const allChildren = toTable(databaseState?.children);
  const facilityChildren = toTable(databaseState?.facility_children);
  const { getServiceRecordMonthly } = useServiceRecord();

  const [facilityId, setFacilityId] = useState(null);
  const [childId, setChildId] = useState(initialChildId);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [step, setStep] = useState('selection');
  const [chatRecords, setChatRecords] = useState([]);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const facilitiesLoading = false;
  const childrenLoading = false;

  // APIタブで設定した施設を優先して選択する。
  // 明示された initialFacilityId がある場合はその値を優先する。
  // 存在しない施設IDをそのまま利用しない。
  useEffect(() => {
    if (facilities.length === 0) {
      setFacilityId(null);
      return;
    }

    const preferredId = initialFacilityId ?? configuredFacilityId;
    setFacilityId((current) => {
      if (preferredId != null && preferredId !== '' &&
          facilities.some((facility) => sameId(getFacilityId(facility), preferredId))) {
        // 設定変更時もAPIタブの選択を反映する。
        return sameId(current, preferredId) ? current : preferredId;
      }
      if (facilities.some((facility) => sameId(getFacilityId(facility), current))) {
        return current;
      }
      return getFacilityId(facilities[0]);
    });
  }, [initialFacilityId, configuredFacilityId, databaseState?.facilitys]);

  // facility_children の紐付けを必須とする。該当0件なら必ず空配列。
  const children = useMemo(() => {
    if (facilityId == null || facilityId === '' || facilityChildren.length === 0) {
      return [];
    }

    const childIdsForFacility = new Set(
      facilityChildren
        .filter((row) => sameId(row?.facility_id, facilityId))
        .map((row) => row?.children_id ?? row?.child_id)
        .filter((id) => id != null)
        .map(String),
    );

    if (childIdsForFacility.size === 0) return [];

    return allChildren.filter((child) =>
      isActiveChild(child) && childIdsForFacility.has(String(getChildId(child))),
    );
  }, [databaseState?.children, databaseState?.facility_children, facilityId]);

  useEffect(() => {
    if (children.length === 0) {
      if (childId) {
        setChildId(null);
      }

      return;
    }

    const hasSelectedChild = children.some((child) =>
      sameId(getChildId(child), childId),
    );

    if (!hasSelectedChild) {
      setChildId(getChildId(children[0]));
    }
  }, [children, childId]);

  const selectedFacilityName = facilities.find(
    (facility) => String(getFacilityId(facility)) === String(facilityId),
  )?.name;

  const selectedChildName = children.find(
    (child) => sameId(getChildId(child), childId),
  )?.name;

  const handleFacilityChange = (value) => {
    setFacilityId(value);
    onFacilityChange?.(value);
  };

  const handleChildChange = (value) => {
    setChildId(value);
    onChildChange?.(value);
  };

  const startChat = async () => {
    // 選択施設と児童の関係が有効なときだけ処理する。
    if (facilityId == null || !children.some((child) => sameId(getChildId(child), childId))) {
      return;
    }
    const targetMonths = getTargetMonths(startDate, endDate);
    const monthlyRows = await Promise.all(
      targetMonths.map((targetMonth) =>
        getServiceRecordMonthly({
          target_month: targetMonth,
          day_of_week_id: null,
          facility_id: Number(facilityId),
          item_id: 1,
        }),
      ),
    );

    const records = monthlyRows
      .flat()
      .filter((record) => {
        const recordDate = getRecordDate(record)?.split('T')[0];

        if (!recordDate) {
          return false;
        }

        return (
          sameId(getRecordChildId(record), childId) &&
          recordDate >= startDate &&
          recordDate <= endDate
        );
      })
      .map((record) => ({
        ...record,
        child_id: getRecordChildId(record),
        target_date: getRecordDate(record),
        content: getRecordContent(record),
      }));

    await new Promise((resolve) => setTimeout(resolve, 500));

    setChatRecords(records);

    const recordMessages = records.map((record, index) => {
      const dateStr = record.target_date
        ? record.target_date.split('T')[0]
        : '日付不明';

      return {
        id: `record-${index}`,
        sender: 'ai',
        text: `${dateStr}: ${record.content}`,
      };
    });

    setMessages([
      {
        id: 'record-summary',
        sender: 'ai',
        text:
          `${selectedFacilityName}：${selectedChildName}さんの` +
          `支援記録データを取得しました（${records.length}件）。`,
      },
      ...recordMessages,
      {
        id: 'record-guide',
        sender: 'ai',
        text:
          records.length > 0
            ? '記録の検索や要約作成が可能です。何をなさいますか？'
            : '指定された期間の記録は見つかりませんでした。',
      },
    ]);

    setConversationId(null);
    setStep('chat');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) {
      return;
    }

    const userText = inputValue;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: userText,
      },
    ]);

    setInputValue('');
    setIsLoading(true);

    const loadingId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        sender: 'ai',
        text: '考え中...',
      },
    ]);

    try {
      if (typeof window.electronAPI?.laravel_ai_chat_message !== 'function') {
        throw new Error('AIチャットAPIが利用できません。');
      }

      const result = await window.electronAPI.laravel_ai_chat_message({
          conversation_id: conversationId,
          message: buildAiPrompt({
            userText,
            facilityName: selectedFacilityName,
            childName: selectedChildName,
            startDate,
            endDate,
            records: chatRecords,
          }),
      });

      if (result?.success === false) {
        throw new Error(result?.message ?? 'AIへの送信に失敗しました。');
      }

      const response = result?.data ?? result;

      if (response?.conversation_id) {
        setConversationId(response.conversation_id);
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === loadingId
            ? {
                ...message,
                text: response?.message ?? 'AIからの応答が空でした。',
              }
            : message,
        ),
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === loadingId
            ? {
                ...message,
                text:
                  error?.message ??
                  'AIへの送信に失敗しました。時間をおいて再度お試しください。',
              }
            : message,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  return (
    <div
      className={`flex w-full ${className}`}
      style={{
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <CatBot className="h-[30px] w-[30px]" />

          <h1>AI問い合わせ機能（チャットボット）</h1>
        </div>

        <p
          style={{
            color: 'var(--text-light)',
          }}
        >
          過去のデータをもとにAIと対話を行います。
        </p>
      </header>

      {step === 'selection' ? (
        <div className="card chat-selection-card">
          <h2 className="mb-4">対象データ選択</h2>

          <div className="flex flex-col gap-6">
            <SelectionPanel
              facilities={facilities}
              children={children}
              facilityId={facilityId}
              childId={childId}
              facilitiesLoading={facilitiesLoading}
              childrenLoading={childrenLoading}
              onFacilityChange={handleFacilityChange}
              onChildChange={handleChildChange}
            />

            <div>
              <label className="label">取得期間</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="input-field"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
                <span>～</span>
                <input
                  type="date"
                  className="input-field"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-primary"
                onClick={startChat}
                disabled={!facilityId || !childId || !startDate || !endDate}
              >
                チャット開始
              </button>
            </div>
          </div>
        </div>
      ) : (
        <ChatPanel
          facilityName={selectedFacilityName}
          childName={selectedChildName}
          messages={messages}
          messagesEndRef={messagesEndRef}
          inputValue={inputValue}
          isLoading={isLoading}
          onBack={() => setStep('selection')}
          onInputChange={setInputValue}
          onSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
}
