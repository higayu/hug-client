export type ServiceRecord = {
  id?: number;
  children_id?: number | string;
  day_of_week_id?: number | string;
  item_id?: number | string;
  served_date?: string;
  facility_id?: number | string;
  note?: string | null;
  is_deleted?: number | string;
};

type GetFsoaipRecordParams = {
  facilityId: number;
  childId: number;
  targetDate: string;
};

function normalizeDate(value: unknown): string {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 10);
}

function extractRecords(result: any): ServiceRecord[] {
  const candidates = [
    result?.data?.data,
    result?.data?.records,
    result?.data,
    result?.records,
    result,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

/**
 * Laravelの get_service_record_monthly をrendererから呼び出し、
 * 選択児童・選択日のF-SOAIP(item_id=2)を1件返す。
 */
export async function getFsoaipRecordForDate({
  facilityId,
  childId,
  targetDate,
}: GetFsoaipRecordParams): Promise<ServiceRecord | null> {
  if (!Number.isFinite(facilityId) || facilityId <= 0) {
    throw new Error('facilityIdが不正です。');
  }

  if (!Number.isFinite(childId) || childId <= 0) {
    throw new Error('childIdが不正です。');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    throw new Error('targetDateはYYYY-MM-DD形式で指定してください。');
  }

  const api = (window as any)?.electronAPI
    ?.laravel_procedure_getServiceRecordMonthly;

  if (typeof api !== 'function') {
    throw new Error(
      'laravel_procedure_getServiceRecordMonthly が利用できません。preload/mainの実装を確認してください。',
    );
  }

  const result = await api({
    target_month: targetDate.slice(0, 7),
    day_of_week_id: null,
    facility_id: facilityId,
    item_id: 2,
  });

  if (result?.success === false || result?.ok === false) {
    throw new Error(
      result?.error?.message ||
        result?.message ||
        'F-SOAIP記録の取得に失敗しました。',
    );
  }

  const records = extractRecords(result);

  return (
    records.find((record) => {
      return (
        Number(record?.children_id) === childId &&
        Number(record?.item_id) === 2 &&
        Number(record?.facility_id) === facilityId &&
        Number(record?.is_deleted ?? 0) === 0 &&
        normalizeDate(record?.served_date) === targetDate
      );
    }) ?? null
  );
}


export type GetFsoaipRecordsForMonthParams = {
  facilityId: number;
  childId: number;
  targetMonth: string;
};

/**
 * Laravelの get_service_record_monthly をrendererから呼び出し、
 * 選択施設・選択児童のF-SOAIP(item_id=2)を月単位で返す。
 */
export async function getFsoaipRecordsForMonth({
  facilityId,
  childId,
  targetMonth,
}: GetFsoaipRecordsForMonthParams): Promise<ServiceRecord[]> {
  if (!Number.isFinite(facilityId) || facilityId <= 0) {
    throw new Error('facilityIdが不正です。');
  }

  if (!Number.isFinite(childId) || childId <= 0) {
    throw new Error('childIdが不正です。');
  }

  if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
    throw new Error('targetMonthはYYYY-MM形式で指定してください。');
  }

  const api = (window as any)?.electronAPI
    ?.laravel_procedure_getServiceRecordMonthly;

  if (typeof api !== 'function') {
    throw new Error(
      'laravel_procedure_getServiceRecordMonthly が利用できません。preload/mainの実装を確認してください。',
    );
  }

  const result = await api({
    target_month: targetMonth,
    day_of_week_id: null,
    facility_id: facilityId,
    item_id: 2,
  });

  if (result?.success === false || result?.ok === false) {
    throw new Error(
      result?.error?.message ||
        result?.message ||
        'F-SOAIP記録の取得に失敗しました。',
    );
  }

  return extractRecords(result)
    .filter((record) => {
      return (
        Number(record?.children_id) === childId &&
        Number(record?.item_id) === 2 &&
        Number(record?.facility_id) === facilityId &&
        Number(record?.is_deleted ?? 0) === 0
      );
    })
    .sort((a, b) => {
      return normalizeDate(b?.served_date).localeCompare(
        normalizeDate(a?.served_date),
      );
    });
}
