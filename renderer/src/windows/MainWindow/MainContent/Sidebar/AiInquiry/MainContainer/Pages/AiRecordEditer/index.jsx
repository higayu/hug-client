// src/pages/AiRecordEditer/index.jsx
import { confirmDialog } from '@/utils/dialog/confirmDialog.js';
import { getWeekdayIdFromDate } from '@/utils/date/dateUtils.js';
import { usePrompt } from '@/hooks/usePrompt'

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  RefreshCw,
  Save,
  Wand2,
} from 'lucide-react';

import {
  useAppState,
} from '@/AppStateContext';

// import { saveSupportRecord } from '@/api';

import {
  buildCorrectionMessage,
  callAiRecordEditer,
} from './lib/ai';

import AiResultModal from './AiResultModal';
import SelectionPanel from './SelectionPanel';
import SavedRecordsPanel from './SavedRecordsPanel';
import { getFsoaipRecordForDate } from './lib/serviceRecords';

const NOT_CHILDREN = 73;

/**
 * オブジェクトから、最初に存在する値を取得する。
 */
const getFirstValue = (
  source,
  keys,
) => {
  if (
    !source ||
    typeof source !== 'object'
  ) {
    return null;
  }

  for (const key of keys) {
    const value = source[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value;
    }
  }

  return null;
};

/**
 * IDを比較可能な文字列へ変換する。
 */
const normalizeId = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return '';
  }

  return String(value);
};

/**
 * 日付をYYYY-MM-DD形式へ変換する。
 */
const normalizeDate = (value) => {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return value
      .toISOString()
      .slice(0, 10);
  }

  return String(value).slice(0, 10);
};

/**
 * 事業所IDを取得する。
 */
const getFacilityId = (facility) => {
  return normalizeId(
    getFirstValue(
      facility,
      [
        'facility_id',
        'facilityId',
        'id',
      ],
    ),
  );
};

/**
 * 事業所名を取得する。
 */
const getFacilityDisplayName = (
  facility,
) => {
  const name = getFirstValue(
    facility,
    [
      'facility_name',
      'facilityName',
      'name',
    ],
  );

  if (name) {
    return String(name);
  }

  const facilityId =
    getFacilityId(facility);

  return facilityId
    ? `事業所ID: ${facilityId}`
    : '名称未設定';
};

/**
 * 児童IDを取得する。
 */
const getChildId = (child) => {
  return normalizeId(
    getFirstValue(
      child,
      [
        'child_id',
        'children_id',
        'childId',
        'id',
      ],
    ),
  );
};

/**
 * 児童名を取得する。
 */
const getChildDisplayName = (child) => {
  const directName = getFirstValue(
    child,
    [
      'child_name',
      'childName',
      'full_name',
      'fullName',
      'name',
    ],
  );

  if (directName) {
    return String(directName);
  }

  const familyName = getFirstValue(
    child,
    [
      'last_name',
      'family_name',
      'sei',
      'surname',
    ],
  );

  const givenName = getFirstValue(
    child,
    [
      'first_name',
      'given_name',
      'mei',
    ],
  );

  const joinedName = [
    familyName,
    givenName,
  ]
    .filter(Boolean)
    .join(' ');

  if (joinedName) {
    return joinedName;
  }

  const childId =
    getChildId(child);

  return childId
    ? `児童ID: ${childId}`
    : '名称未設定';
};

/**
 * 事業所・児童関連テーブルの事業所IDを取得する。
 */
const getRelationFacilityId = (
  relation,
) => {
  return normalizeId(
    getFirstValue(
      relation,
      [
        'facility_id',
        'facilityId',
      ],
    ),
  );
};

/**
 * 事業所・児童関連テーブルの児童IDを取得する。
 */
const getRelationChildId = (
  relation,
) => {
  return normalizeId(
    getFirstValue(
      relation,
      [
        'child_id',
        'children_id',
        'childId',
      ],
    ),
  );
};

/**
 * 指定日が所属期間内か判定する。
 *
 * 実際のカラム名に多少違いがあっても
 * 対応できるよう、複数候補を確認する。
 */
const isRelationActiveOnDate = (
  relation,
  targetDate,
) => {
  const normalizedTargetDate =
    normalizeDate(targetDate);

  if (!normalizedTargetDate) {
    return true;
  }

  const startDate = normalizeDate(
    getFirstValue(
      relation,
      [
        'start_date',
        'date_start',
        'effective_from',
        'valid_from',
        'use_start_date',
        'contract_start_date',
      ],
    ),
  );

  const endDate = normalizeDate(
    getFirstValue(
      relation,
      [
        'end_date',
        'date_end',
        'effective_to',
        'valid_to',
        'use_end_date',
        'contract_end_date',
      ],
    ),
  );

  if (
    startDate &&
    normalizedTargetDate < startDate
  ) {
    return false;
  }

  if (
    endDate &&
    normalizedTargetDate > endDate
  ) {
    return false;
  }

  return true;
};

/**
 * 事業所IDから事業所名を取得する。
 */
const getFacilityName = (
  facilities,
  facilityId,
) => {
  const normalizedFacilityId =
    normalizeId(facilityId);

  const selectedFacility =
    facilities.find(
      (facility) =>
        getFacilityId(facility) ===
        normalizedFacilityId,
    );

  return selectedFacility
    ? getFacilityDisplayName(
        selectedFacility,
      )
    : '未選択';
};

/**
 * 児童IDから児童名を取得する。
 */
const getChildName = (
  children,
  childId,
) => {
  const normalizedChildId =
    normalizeId(childId);

  const selectedChild =
    children.find(
      (child) =>
        getChildId(child) ===
        normalizedChildId,
    );

  return selectedChild
    ? getChildDisplayName(
        selectedChild,
      )
    : '未選択';
};

/**
 * 現在選択中の児童IDが有効なら維持し、
 * 無効なら一覧の先頭を返す。
 */
const pickValidChildId = (
  children,
  currentChildId,
  preferredChildId = '',
) => {
  const normalizedCurrentChildId =
    normalizeId(currentChildId);

  const currentExists =
    children.some(
      (child) =>
        getChildId(child) ===
        normalizedCurrentChildId,
    );

  if (currentExists) {
    return normalizedCurrentChildId;
  }

  const normalizedPreferredChildId =
    normalizeId(preferredChildId);

  const preferredExists =
    children.some(
      (child) =>
        getChildId(child) ===
        normalizedPreferredChildId,
    );

  if (preferredExists) {
    return normalizedPreferredChildId;
  }

  return children.length > 0
    ? getChildId(children[0])
    : '';
};

const getErrorMessage = (error) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return '不明なエラーが発生しました。';
};

const AiRecordEditer = () => {
  const {
    dbFacilitys,
    dbChildren,
    dbFacilityChildren,
    databaseLoading,
    databaseError,
    FACILITY_ID,
    DATABASE_TYPE,
    STAFF_ID,
  } = useAppState();

  const { childId: activeChildId } = useChilledSpace();

  const { getActiveAiPrompts } = usePrompt();

  const defaultDate = new Date().toISOString().split('T')[0];

  const [ targetDate,setTargetDate,] = useState(defaultDate);

  const [  facilityId,setFacilityId,] = useState('');

  const [ childId,setChildId,] = useState('');

  const [
    activeTab,
    setActiveTab,
  ] = useState('simple');

  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);

  const [
    isCorrecting,
    setIsCorrecting,
  ] = useState(false);

  const [
    originalText,
    setOriginalText,
  ] = useState('');

  const [
    correctedText,
    setCorrectedText,
  ] = useState('');

  const [
    additionalPrompt,
    setAdditionalPrompt,
  ] = useState('');

  const [systemPrompt, setSystemPrompt] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [savedRecordsRefreshKey, setSavedRecordsRefreshKey] = useState(0);

  /**
   * DBからF-SOAIP用プロンプトを取得する。
   */
  useEffect(() => {
    let cancelled = false;

    const loadFsoaipPrompt = async () => {
      if (!DATABASE_TYPE || !STAFF_ID) {
        if (!cancelled) {
          setSystemPrompt('');
        }
        return;
      }

      setPromptLoading(true);

      try {
        const records = await getActiveAiPrompts({
          databaseType: DATABASE_TYPE,
          staffId: STAFF_ID,
          itemId: 50,
        });

        const content = records?.['F-SOAIP']?.content ?? '';

        if (!cancelled) {
          setSystemPrompt(content);
        }
      } catch (error) {
        console.error('[AiRecordEditer/loadFsoaipPrompt]', error);

        if (!cancelled) {
          setSystemPrompt('');
        }
      } finally {
        if (!cancelled) {
          setPromptLoading(false);
        }
      }
    };

    loadFsoaipPrompt();

    return () => {
      cancelled = true;
    };
  }, [
    DATABASE_TYPE,
    STAFF_ID,
    getActiveAiPrompts,
  ]);

  /**
   * 選択中の事業所・児童・支援日のF-SOAIP記録(item_id=2)を
   * get_service_record_monthly経由でDBから取得する。
   */
  useEffect(() => {
    let cancelled = false;

    const loadFsoaipRecord = async () => {
      if (!facilityId || !childId || !targetDate) {
        return;
      }

      setRecordLoading(true);
      setCorrectedText('');

      try {
        const record = await getFsoaipRecordForDate({
          facilityId: Number(facilityId),
          childId: Number(childId),
          targetDate,
        });

        if (cancelled) {
          return;
        }

        setOriginalText(
          typeof record?.note === 'string'
            ? record.note
            : '',
        );

        console.log(
          '[AiRecordEditer/loadFsoaipRecord]',
          {
            facilityId,
            childId,
            targetDate,
            record,
          },
        );
      } catch (error) {
        console.error(
          '[AiRecordEditer/loadFsoaipRecord]',
          error,
        );

        if (!cancelled) {
          setOriginalText('');
        }
      } finally {
        if (!cancelled) {
          setRecordLoading(false);
        }
      }
    };

    loadFsoaipRecord();

    return () => {
      cancelled = true;
    };
  }, [
    facilityId,
    childId,
    targetDate,
  ]);

  const [
    expandedSections,
    setExpandedSections,
  ] = useState({
    original: true,
    systemPrompt: true,
    additionalPrompt: true,
    corrected: true,
  });

  /**
   * AppStateContextの事業所一覧を、
   * 画面表示用の形式へ変換する。
   */
  const facilities = useMemo(() => {
    const source = Array.isArray(
      dbFacilitys,
    )
      ? dbFacilitys
      : [];

    const facilityMap =
      new Map();

    source.forEach((facility) => {
      const currentFacilityId =
        getFacilityId(facility);

      if (!currentFacilityId) {
        return;
      }

      if (
        facilityMap.has(
          currentFacilityId,
        )
      ) {
        return;
      }

      facilityMap.set(
        currentFacilityId,
        {
          ...facility,
          facility_id:
            currentFacilityId,
          name:
            getFacilityDisplayName(
              facility,
            ),
        },
      );
    });

    return Array.from(
      facilityMap.values(),
    );
  }, [
    dbFacilitys,
  ]);

  /**
   * 選択中事業所と支援日から、
   * 表示対象の児童一覧を生成する。
   */
  const childrenList = useMemo(() => {
    const normalizedFacilityId =
      normalizeId(facilityId);

    if (!normalizedFacilityId) {
      return [];
    }

    const childrenSource =
      Array.isArray(dbChildren)
        ? dbChildren
        : [];

    const relationSource =
      Array.isArray(
        dbFacilityChildren,
      )
        ? dbFacilityChildren
        : [];

    /**
     * facility_childrenが取得できている場合は、
     * 関連テーブルを基準に絞り込む。
     */
    const relatedChildIds =
      new Set(
        relationSource
          .filter((relation) => {
            return (
              getRelationFacilityId(
                relation,
              ) ===
                normalizedFacilityId &&
              isRelationActiveOnDate(
                relation,
                targetDate,
              )
            );
          })
          .map((relation) =>
            getRelationChildId(
              relation,
            ),
          )
          .filter(Boolean),
      );

    const childMap =
      new Map();

    childrenSource.forEach((child) => {
      const currentChildId =
        getChildId(child);

      if (!currentChildId) {
        return;
      }

      // ChatPage と同様に削除済み児童は選択肢から除外する。
      if (Number(child?.is_delete ?? 0) === 1) {
        return;
      }

      if (
        Number(currentChildId) ===
        NOT_CHILDREN
      ) {
        return;
      }

      let belongsToFacility =
        false;

      if (
        relationSource.length > 0 &&
        relatedChildIds.size > 0
      ) {
        belongsToFacility =
          relatedChildIds.has(
            currentChildId,
          );
      } else if (relationSource.length > 0) {
        // ChatPage と同様に、選択施設に紐づく行が無い場合は
        // 全アクティブ児童を候補として扱う。
        belongsToFacility = true;
      } else {
        /**
         * 関連テーブルが空の場合は、
         * children側のfacility_idを確認する。
         */
        const childFacilityId =
          normalizeId(
            getFirstValue(
              child,
              [
                'facility_id',
                'facilityId',
              ],
            ),
          );

        belongsToFacility =
          childFacilityId ===
          normalizedFacilityId;
      }

      if (!belongsToFacility) {
        return;
      }

      if (
        childMap.has(
          currentChildId,
        )
      ) {
        return;
      }

      childMap.set(
        currentChildId,
        {
          ...child,
          child_id:
            currentChildId,
          name:
            getChildDisplayName(
              child,
            ),
        },
      );
    });

    return Array.from(
      childMap.values(),
    ).sort((first, second) => {
      return first.name.localeCompare(
        second.name,
        'ja',
      );
    });
  }, [
    dbChildren,
    dbFacilityChildren,
    facilityId,
    targetDate,
  ]);

  const facilitiesLoading =
    Boolean(databaseLoading) &&
    facilities.length === 0;

  const childrenLoading =
    Boolean(databaseLoading) &&
    Boolean(facilityId) &&
    childrenList.length === 0;

  /**
   * 初期事業所を設定する。
   *
   * ReduxにFACILITY_IDがある場合は優先し、
   * なければ一覧の先頭を使用する。
   */
  useEffect(() => {
    if (facilities.length === 0) {
      if (facilityId !== '') {
        setFacilityId('');
      }

      if (childId !== '') {
        setChildId('');
      }

      return;
    }

    const normalizedFacilityId =
      normalizeId(facilityId);

    const currentIsValid =
      facilities.some(
        (facility) =>
          getFacilityId(facility) ===
          normalizedFacilityId,
      );

    if (currentIsValid) {
      return;
    }

    const preferredFacilityId =
      normalizeId(FACILITY_ID);

    const preferredIsValid =
      facilities.some(
        (facility) =>
          getFacilityId(facility) ===
          preferredFacilityId,
      );

    const nextFacilityId =
      preferredIsValid
        ? preferredFacilityId
        : getFacilityId(
            facilities[0],
          );

    setFacilityId(
      nextFacilityId,
    );

    setChildId('');
  }, [
    facilities,
    facilityId,
    childId,
    FACILITY_ID,
  ]);

  /**
   * 事業所・支援日が変わったときに、
   * 有効な児童を選択する。
   */
  useEffect(() => {
    const appStateChildId =
      normalizeId(activeChildId);

    const validChildId =
      pickValidChildId(
        childrenList,
        childId,
        appStateChildId,
      );

    if (
      validChildId !==
      normalizeId(childId)
    ) {
      setChildId(validChildId);
    }
  }, [
    childId,
    childrenList,
  ]);

  const toggleSection = (section) => {
    if (
      !Object.prototype.hasOwnProperty.call(
        expandedSections,
        section,
      )
    ) {
      return;
    }

    setExpandedSections(
      (previousSections) => ({
        ...previousSections,

        [section]:
          !previousSections[section],
      }),
    );
  };

  const handleCorrect = async () => {
    if (!originalText.trim()) {
      alert(
        '校正するテキストを入力してください',
      );

      return;
    }

    if (!systemPrompt.trim()) {
      alert('F-SOAIPプロンプトを取得できていません。設定画面で有効なF-SOAIPプロンプトを確認してください。');
      return;
    }

    setIsCorrecting(true);

    try {
      const message =
        buildCorrectionMessage({
          originalText,
          additionalPrompt,
        });

      const result =
        await callAiRecordEditer({
          prompt: systemPrompt,
          message,
        });

      setCorrectedText(result);
      setIsModalOpen(true);
    } catch (error) {
      console.error(
        '[handleCorrect]',
        error,
      );

      alert(
        `AI校正に失敗しました: ${getErrorMessage(error)}`,
      );
    } finally {
      setIsCorrecting(false);
    }
  };

  const hasForbiddenForBlock = (
    text,
  ) => {
    return /`for(?:\s[^`]*)?`/.test(
      text,
    );
  };

  const validateSupportRecordPayload = (
    payload,
  ) => {
    if (
      !payload.children_id ||
      Number.isNaN(payload.children_id) ||
      payload.children_id === NOT_CHILDREN
    ) {
      return '児童が選択されていません。';
    }

    if (!payload.facility_id || Number.isNaN(payload.facility_id)) {
      return '事業所が選択されていません。';
    }

    if (!payload.served_date?.trim()) {
      return '支援日が選択されていません。';
    }

    if (!payload.day_of_week_id) {
      return '支援日の曜日IDを取得できません。';
    }

    if (!payload.note?.trim()) {
      return '登録する記録内容がありません。文章を入力してください。';
    }

    if (
      hasForbiddenForBlock(
        payload.note,
      )
    ) {
      return '登録内容に使用できない記述「`for`」または「`for ...`」が含まれているため、登録できません。';
    }

    return null;
  };

  const handleRegister = async () => {
    const selectedFacility =
      getFacilityName(
        facilities,
        facilityId,
      );

    const selectedChild =
      getChildName(
        childrenList,
        childId,
      );

    // AI校正結果がある場合はそちらを優先し、
    // 未校正または『反映して閉じる』後は現在の入力欄を保存する。
    const recordText =
      correctedText.trim() ||
      originalText.trim();

    if (!recordText) {
      alert('登録する記録内容がありません。文章を入力してください。');
      return;
    }

    const recordSource = correctedText.trim()
      ? 'AI校正結果'
      : '現在の入力内容';

    const dayOfWeekId =
      getWeekdayIdFromDate(targetDate);

    const staffId = Number(STAFF_ID);

    const payload = {
      children_id: Number(childId),
      item_id: 2,
      facility_id: Number(facilityId),
      served_date: targetDate,
      day_of_week_id: dayOfWeekId,
      note: recordText,
      is_copy: 0,
      is_deleted: 0,
      recorded_staff_id:
        Number.isNaN(staffId) ? -1 : staffId,
      updated_staff_id:
        Number.isNaN(staffId) ? -1 : staffId,
    };

    const validationError =
      validateSupportRecordPayload(
        payload,
      );

    if (validationError) {
      alert(validationError);
      return;
    }

    console.log(
      '[AiRecordEditer/register] 送信する値',
      payload,
    );

    const shouldRegister = await confirmDialog(
      `【F-SOAIP登録内容の確認】\n` +
      `・事業所: ${selectedFacility}\n` +
      `・児童: ${selectedChild}\n` +
      `・支援日: ${targetDate}\n` +
      `・item_id: 2\n\n` +
      `・登録内容: ${recordSource}\n\n` +
      `この内容をF-SOAIP記録（item_id: 2）として登録します。よろしいですか？`,
    );

    if (!shouldRegister) {
      return;
    }

    const serviceRecordUpsert =
      DATABASE_TYPE === 'laravel'
        ? window.electronAPI?.laravel_procedure_upsertServiceRecord
        : window.electronAPI?.mariadb_service_record_upsert;

    const serviceRecordUpsertApiName =
      DATABASE_TYPE === 'laravel'
        ? 'laravel_procedure_upsertServiceRecord'
        : 'mariadb_service_record_upsert';

    if (typeof serviceRecordUpsert !== 'function') {
      alert(
        `${serviceRecordUpsertApiName} が利用できません。main / preload の実装を確認してください。`,
      );
      return;
    }

    try {
      const result =
        await serviceRecordUpsert(payload);

      console.log(
        '[AiRecordEditer/register] 保存結果',
        result,
      );

      if (result?.success === false || result?.ok === false) {
        throw new Error(
          result?.error?.message ||
          result?.message ||
          'F-SOAIP記録の保存に失敗しました。',
        );
      }

      alert(
        'F-SOAIP記録をDBへ登録しました！',
      );

      setSavedRecordsRefreshKey((previous) => previous + 1);

      setOriginalText('');
      setCorrectedText('');
      setAdditionalPrompt('');
      setIsModalOpen(false);
    } catch (error) {
      console.error(
        '[AiRecordEditer/register]',
        error,
      );

      alert(
        `登録に失敗しました: ${getErrorMessage(error)}`,
      );
    }
  };

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          AI校正機能（入力支援）
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          支援記録をF-SOAIP形式などに校正します。
        </p>
      </header>

      {databaseError && (
        <div
          className="
            mb-4
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
          "
          role="alert"
        >
          事業所・児童データの取得に失敗しました。
        </div>
      )}

      <div className="mb-6 flex gap-3 border-b border-gray-200 pb-4">
        <button
          type="button"
          className={`
            rounded-xl
            px-5
            py-2.5
            text-sm
            font-semibold
            transition-all
            ${
              activeTab === 'simple'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }
          `}
          onClick={() => {
            setActiveTab('simple');
          }}
        >
          案1: シンプル重視
        </button>

        <button
          type="button"
          className={`
            rounded-xl
            px-5
            py-2.5
            text-sm
            font-semibold
            transition-all
            ${
              activeTab === 'advanced'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }
          `}
          onClick={() => {
            setActiveTab(
              'advanced',
            );
          }}
        >
          案2: 多機能・利便性重視
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SelectionPanel
            facilities={facilities}
            children={childrenList}
            facilityId={facilityId}
            childId={childId}
            facilitiesLoading={facilitiesLoading}
            childrenLoading={childrenLoading}
            onFacilityChange={(nextFacilityId) => {
              setFacilityId(nextFacilityId);
              setChildId('');
            }}
            onChildChange={setChildId}
          />

          <div>
            <label
              htmlFor="ai-record-target-date"
              className="mb-1.5 block text-sm font-semibold text-gray-700"
            >
              支援日
            </label>

            <input
              id="ai-record-target-date"
              type="date"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-sm text-gray-800 transition-all focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              value={targetDate}
              onChange={(event) => {
                setTargetDate(
                  event.target.value,
                );
              }}
            />
          </div>
        </div>

        {activeTab === 'simple' ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                校正の仕方の指示プロンプト（編集不可）
              </label>

              <p className="whitespace-pre-wrap text-sm text-gray-500">
                {promptLoading
                  ? 'F-SOAIPプロンプトを取得中...'
                  : systemPrompt || 'F-SOAIPプロンプトが設定されていません。'}
              </p>
            </div>

            <div>
              <label
                htmlFor="ai-record-original-simple"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                支援記録コメント欄に記載する文章
              </label>

              <textarea
                id="ai-record-original-simple"
                className="min-h-[140px] w-full resize-y rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm text-gray-800 transition-all focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/20"
                rows={6}
                value={originalText}
                onChange={(event) => {
                  setOriginalText(
                    event.target.value,
                  );
                }}
                placeholder={recordLoading ? "DBからF-SOAIP記録を取得中..." : "例：今日は公園で遊んだ。少し疲れた様子だった。"}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                校正の仕方の指示プロンプト（編集不可）
              </label>

              <p className="whitespace-pre-wrap text-sm text-gray-500">
                {promptLoading
                  ? 'F-SOAIPプロンプトを取得中...'
                  : systemPrompt || 'F-SOAIPプロンプトが設定されていません。'}
              </p>
            </div>

            <div>
              <label
                htmlFor="ai-record-additional-prompt"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                追加プロンプト（任意）
              </label>

              <textarea
                id="ai-record-additional-prompt"
                className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm text-gray-800 transition-all focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/20"
                rows={2}
                value={additionalPrompt}
                onChange={(event) => {
                  setAdditionalPrompt(
                    event.target.value,
                  );
                }}
                placeholder="例：保護者にも伝わりやすい表現にしてください。"
              />
            </div>

            <div>
              <label
                htmlFor="ai-record-original-advanced"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                支援記録コメント欄に記載する文章
              </label>

              <textarea
                id="ai-record-original-advanced"
                className="min-h-[140px] w-full resize-y rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm text-gray-800 transition-all focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/20"
                rows={6}
                value={originalText}
                onChange={(event) => {
                  setOriginalText(
                    event.target.value,
                  );
                }}
                placeholder={recordLoading ? "DBからF-SOAIP記録を取得中..." : "例：今日は公園で遊んだ。少し疲れた様子だった。"}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            onClick={handleRegister}
          >
            <Save size={18} />
            登録する
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-pink-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleCorrect}
            disabled={isCorrecting}
          >
            {isCorrecting ? (
              <RefreshCw
                size={18}
                className="animate-spin"
              />
            ) : (
              <Wand2 size={18} />
            )}

            {isCorrecting
              ? ' 校正中...'
              : ' AIで校正する'}
          </button>
        </div>
      </div>


      <SavedRecordsPanel
        facilityId={facilityId}
        childId={childId}
        targetDate={targetDate}
        refreshKey={savedRecordsRefreshKey}
      />

      {isModalOpen && (
        <AiResultModal
          activeTab={activeTab}
          originalText={originalText}
          correctedText={correctedText}
          additionalPrompt={additionalPrompt}
          expandedSections={expandedSections}
          onClose={() => {
            setIsModalOpen(false);
          }}
          onToggleSection={toggleSection}
          onChangeOriginalText={
            setOriginalText
          }
          onChangeCorrectedText={
            setCorrectedText
          }
          onChangeAdditionalPrompt={
            setAdditionalPrompt
          }
          onClear={() => {
            setOriginalText('');
            setCorrectedText('');
            setAdditionalPrompt('');
          }}
          onApplyAndClose={() => {
            setOriginalText(
              correctedText,
            );

            setCorrectedText('');
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default AiRecordEditer;
