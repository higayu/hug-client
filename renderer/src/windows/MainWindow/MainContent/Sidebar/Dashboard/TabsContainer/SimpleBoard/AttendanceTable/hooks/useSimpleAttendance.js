import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppState } from '@/AppStateContext';

import {
  resolveAttendanceRowItem,
  performEnterAction,
  performLeaveAction,
  EnterMailDialogCancelledError,
  LeaveMailDialogCancelledError,
} from '@/components/common/hug_function/AttendanceAction';

const normalizeText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const extractActionRowId = (...htmlValues) => {
  for (const html of htmlValues) {
    const match = String(html ?? '').match(
      /send(?:Enter|Leave)Mail\s*\(\s*['"]?([^'",)]+)/,
    );

    if (match?.[1]) return match[1];
  }

  return '';
};

/**
 * attendanceData.data を SimpleBoard 表示用へ変換する。
 *
 * 入退室実行時に FanContent/SelectChildren と同じ処理を利用できるよう、
 * column5/6 と HTML も行データへ保持する。
 */
const toAttendanceRow = (child, index) => {
  const enterText = normalizeText(child?.column5);
  const leaveText = normalizeText(child?.column6);
  const enterHtml = String(child?.column5Html ?? '');
  const leaveHtml = String(child?.column6Html ?? '');
  const childId = child?.children_id ?? child?.child_id ?? child?.id ?? '';
  const childName =
    normalizeText(child?.children_name).replace(/\s*さん$/, '') || '名称不明';

  return {
    rId:
      extractActionRowId(enterHtml, leaveHtml) ||
      `attendance-${childId || child?.rowIndex || index}`,

    childId: String(childId),
    name: childName,
    furiganaName: '',

    enterTime: /^\d{1,2}:\d{2}$/.test(enterText)
      ? enterText.padStart(5, '0')
      : '',

    leaveTime: /^\d{1,2}:\d{2}$/.test(leaveText)
      ? leaveText.padStart(5, '0')
      : '',

    canEnter: /sendEnterMail/.test(enterHtml),
    canLeave: /sendLeaveMail/.test(leaveHtml),
    isAbsent: enterText.includes('欠席') && !/sendEnterMail/.test(enterHtml),

    // FanContent/SelectChildren の入退室処理へ渡す元データ。
    column5: child?.column5 ?? '',
    column5Html: enterHtml,
    column6: child?.column6 ?? '',
    column6Html: leaveHtml,

    // デバッグや将来の拡張用に元行も保持する。
    source: child,
  };
};

const isMailDialogCancelled = (error) =>
  error instanceof EnterMailDialogCancelledError ||
  error instanceof LeaveMailDialogCancelledError ||
  error?.name === 'MailDialogCancelledError';

/**
 * SimpleBoard 入退室管理。
 *
 * 入退室の実処理は FanContent/SelectChildren と共通化する。
 * SimpleBoard 独自の button.click() は使用しない。
 */
export function useSimpleAttendance() {
  const { FACILITY_ID, CURRENT_YMD, attendanceData } = useAppState();

  const [actionRowId, setActionRowId] = useState(null);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  const attendanceDate =
    normalizeText(attendanceData?.dateStr) ||
    normalizeText(CURRENT_YMD);

  const attendanceFacilityId =
    attendanceData?.facilityId ??
    FACILITY_ID;

  const rows = useMemo(
    () =>
      Array.isArray(attendanceData?.data)
        ? attendanceData.data.map(toAttendanceRow)
        : [],
    [attendanceData?.data],
  );

  const lastUpdatedAt = useMemo(() => {
    if (!attendanceData?.extractedAt) return '';

    const extractedAt = new Date(attendanceData.extractedAt);

    return Number.isNaN(extractedAt.getTime())
      ? ''
      : extractedAt.toLocaleTimeString('ja-JP');
  }, [attendanceData?.extractedAt]);

  const runAction = useCallback(
    async (row, kind, actionOptions = {}) => {
      if (!row?.childId) {
        setError('児童IDを取得できないため、入退室処理を実行できません。');
        return;
      }

      if (!attendanceFacilityId) {
        setError('施設IDを取得できないため、入退室処理を実行できません。');
        return;
      }

      if (!attendanceDate) {
        setError('対象日付を取得できないため、入退室処理を実行できません。');
        return;
      }

      setActionRowId(row.rId);
      setError('');

      try {
        /**
         * FanContent/SelectChildren と同じ方法で、
         * 最新の出席行 + onclick + mail設定を取得する。
         */
        const resolved = await resolveAttendanceRowItem({
          facilityId: String(attendanceFacilityId),
          dateStr: attendanceDate,
          children_id: row.childId,
          children_name: row.name,
          column5: row.column5,
          column5Html: row.column5Html,
          column6: row.column6,
          column6Html: row.column6Html,
        });

        if (!resolved?.ok || !resolved?.item) {
          throw new Error(
            resolved?.error ||
              `${kind === 'enter' ? '入室' : '退室'}用の出席データを取得できませんでした`,
          );
        }

        const context = {
          facilityId: String(attendanceFacilityId),
          dateStr: attendanceDate,
          webview: resolved.webview || undefined,
        };

        let result;

        if (kind === 'enter') {
          result = await performEnterAction(
            resolved.item,
            {
              ...context,
              ...actionOptions,
            },
          );
        } else if (kind === 'leave') {
          result = await performLeaveAction(
            resolved.item,
            {
              ...context,
              ...actionOptions,
            },
          );
        } else {
          throw new Error(`未対応の入退室アクションです: ${kind}`);
        }

        if (!result?.success) {
          throw new Error(
            result?.error ||
              `${kind === 'enter' ? '入室' : '退室'}処理に失敗しました`,
          );
        }

        return result;
      } catch (cause) {
        /**
         * メール通知ダイアログのキャンセルは操作エラーとして表示しない。
         */
        if (isMailDialogCancelled(cause)) {
          return {
            success: false,
            cancelled: true,
          };
        }

        console.error('[SimpleBoard][Attendance] 入退室処理エラー:', {
          row,
          kind,
          cause,
        });

        if (mounted.current) {
          setError(cause?.message || String(cause));
        }

        return {
          success: false,
          error: cause?.message || String(cause),
        };
      } finally {
        if (mounted.current) {
          setActionRowId(null);
        }
      }
    },
    [
      attendanceDate,
      attendanceFacilityId,
    ],
  );

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  return {
    rows,
    loading: false,
    actionRowId,
    error,
    lastUpdatedAt,
    runAction,
  };
}
