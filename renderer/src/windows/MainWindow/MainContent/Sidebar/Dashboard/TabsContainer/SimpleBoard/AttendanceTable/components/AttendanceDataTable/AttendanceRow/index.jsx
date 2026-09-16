import PersonalRecordButton from './PersonalRecordButton';
import ProfessionalSupportCheckPanel from './ProfessionalSupportCheckPanel';
import { useAppState } from '@/AppStateContext';

import {
  EnterButton,
  LeaveButton,
  hasEnterMail,
  hasLeaveMail,
  buildEnterButtonTitle,
  buildLeaveButtonTitle,
  isAfternoonEnterBlocked,
} from '@/components/common/hug_function/AttendanceAction';

export default function AttendanceRow({ row, busy, onAction }) {
  const { CURRENT_YMD } = useAppState();
  const canOpenPersonalRecord = Boolean(row.childId);

  const enterHasMail = hasEnterMail(
    row.column5Html,
    row.childId,
    row.name,
    CURRENT_YMD,
  );

  const leaveHasMail = hasLeaveMail(
    row.column6Html,
    row.childId,
    row.name,
    CURRENT_YMD,
  );

  const afternoonBlocked =
    !row.enterTime &&
    isAfternoonEnterBlocked(
      row.column5Html,
      row.childId,
      CURRENT_YMD,
    );

  const nameContent = (
    <div className="flex flex-col leading-tight">
      {row.furiganaName && (
        <span className="mb-1 text-[11px] font-medium text-slate-500">
          {row.furiganaName}
        </span>
      )}
      <span className="font-semibold">{row.name}</span>
    </div>
  );

  return (
    <tr className="odd:bg-white even:bg-slate-50">
      <td className="border border-slate-300 p-1">
        {canOpenPersonalRecord ? (
          <PersonalRecordButton
            selectedChildId={row.childId}
            selectedChildName={row.name}
            currentYmd={CURRENT_YMD}
            label={nameContent}
            className="block w-full rounded px-1 py-0.5 text-left text-slate-900 bg-transparent hover:bg-sky-50 hover:text-sky-700 hover:scale-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        ) : (
          nameContent
        )}
      </td>
      <td className="border border-slate-300 p-3 text-center">{row.enterTime || '―'}</td>
      <td className="border border-slate-300 p-3 text-center">{row.leaveTime || '―'}</td>
      <td className="border border-slate-300 p-2 align-top">
        <ProfessionalSupportCheckPanel
          currentYmd={CURRENT_YMD}
          selectedChildId={row.childId}
          selectedChildName={row.name}
          enterTime={row.enterTime}
          leaveTime={row.leaveTime}
          isAbsent={row.isAbsent}
          hasEntered={Boolean(row.enterTime)}
          hasExited={Boolean(row.leaveTime)}
          isUIEnabled
          isStop={false}
          loadingAction={busy ? 'attendance' : null}
          logTag={`AttendanceRow:${row.rId}`}
          className="min-w-[220px]"
          labelClassName="border border-slate-100"
        />
      </td>
      <td className="border border-slate-300 p-3">
        <div className="child-memo-attendance-form flex flex-col items-center gap-1">
          <div className="hug-post-actions hug-post-actions-inline justify-center gap-2">
            {row.canEnter && (
              <EnterButton
                childId={row.childId}
                childName={row.name}
                dateStr={CURRENT_YMD}
                hasMail={enterHasMail}
                disabled={busy || afternoonBlocked}
                loading={busy}
                title={buildEnterButtonTitle(
                  row.column5Html,
                  row.childId,
                  CURRENT_YMD,
                )}
                onEnter={(options) => onAction(row, 'enter', options)}
              />
            )}

            {row.canLeave && (
              <LeaveButton
                childId={row.childId}
                childName={row.name}
                dateStr={CURRENT_YMD}
                hasMail={leaveHasMail}
                disabled={busy}
                loading={busy}
                title={buildLeaveButtonTitle(
                  row.column6Html,
                  row.childId,
                  CURRENT_YMD,
                )}
                onLeave={(options) => onAction(row, 'leave', options)}
              />
            )}

            {!row.canEnter && !row.canLeave && (
              <span className="p-2 text-gray-500">
                {row.isAbsent
                  ? '欠席'
                  : row.leaveTime
                    ? '退室済み'
                    : '操作なし'}
              </span>
            )}
          </div>

          {row.canEnter && afternoonBlocked ? (
            <p className="w-full text-center text-xs text-orange-700">
              午後枠：ハーフタイムまで入室できません
            </p>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
