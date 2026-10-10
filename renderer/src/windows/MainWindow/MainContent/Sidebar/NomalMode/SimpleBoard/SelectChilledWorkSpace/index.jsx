import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import VerticaPanel from '@/components/ui/ResizableSplitPane/VerticaPanel';
import HorizonPanel from '@/components/ui/ResizableSplitPane/HorizonPanel';
import * as simpleBoardBindings from '@/store/slices/simpleBoardSlice';
import { useSimpleAttendanceRows } from '../AttendanceTable/hooks/useSimpleAttendance';
import WorkingPanel from './WorkingPanel';
import SelectChildren from './SelectChildren';

function SelectedChildSpace({ row }) {
  const dispatch = useDispatch();
  const spaceId = simpleBoardBindings.getSimpleBoardSpaceId(row.rId);
  const childId = useSelector((state) => state.simpleBoard.spaces[spaceId]?.childId);

  return (
    <section
      className="h-full min-h-0 min-w-0"
      aria-label={`${row.name}の作業スペース`}
      onFocusCapture={() => dispatch(simpleBoardBindings.setActiveSpaceId(spaceId))}
      onPointerDownCapture={() => dispatch(simpleBoardBindings.setActiveSpaceId(spaceId))}
    >
      <HorizonPanel
        defaultLeftPercent={30}
        minLeftWidth={280}
        minRightWidth={300}
        resizeBarWidth={10}
        gripWidth={6}
        left={childId === row.childId ? <SelectChildren spaceId={spaceId} /> : null}
        right={(
          <div className="h-full min-h-0 min-w-0 overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            {childId === row.childId && (
              <WorkingPanel
                key={row.childId}
                spaceId={spaceId}
              />
            )}
          </div>
        )}
      />
    </section>
  );
}

export default function SelectChilledWorkSpace() {
  const dispatch = useDispatch();
  const selectedRowIds = useSelector(simpleBoardBindings.selectSelectedRowIds);
  const rows = useSimpleAttendanceRows();
  // 選択順を維持し、残った児童の作業状態を保持する。
  const selectedRows = selectedRowIds
    .map((rowId) => rows.find((row) => row.rId === rowId))
    .filter(Boolean);

  useEffect(() => {
    dispatch(simpleBoardBindings.syncSelectedChildren(rows));
  }, [dispatch, rows, selectedRowIds]);

  if (selectedRows.length === 0) {
    return <p className="p-4 text-sm text-slate-500">入退室一覧から児童を1〜2人選択してください。</p>;
  }

  if (selectedRows.length === 1) {
    return <SelectedChildSpace key={selectedRows[0].rId} row={selectedRows[0]} />;
  }

  return (
    <VerticaPanel
      defaultTopPercent={50}
      minTopHeight={160}
      minBottomHeight={160}
      top={<SelectedChildSpace key={selectedRows[0].rId} row={selectedRows[0]} />}
      bottom={<SelectedChildSpace key={selectedRows[1].rId} row={selectedRows[1]} />}
    />
  );
}
