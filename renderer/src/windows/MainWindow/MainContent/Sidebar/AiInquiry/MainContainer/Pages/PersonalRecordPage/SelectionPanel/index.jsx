const toSelectId = (row, primaryKey) => row?.[primaryKey] ?? row?.id ?? '';
const toSelectValue = (value) => value ?? '';

export default function SelectionPanel({
  facilities,
  children,
  facilityId,
  childId,
  facilitiesLoading = false,
  childrenLoading = false,
  onFacilityChange,
  onChildChange,
}) {
  return (
    <div className="flex flex-row items-end gap-3">
        <div>
          <label className="label">事業所</label>
          {facilitiesLoading && <p className="child-fetch-status" role="status" aria-live="polite">取得中…</p>}
          <select
            className="input-field"
            value={toSelectValue(facilityId)}
            disabled={facilitiesLoading}
            onChange={(e) => onFacilityChange?.(Number(e.target.value))}
          >
            {facilities.map((facility, index) => {
              const facilityOptionId = toSelectId(facility, 'facility_id');
              const facilityKey = facilityOptionId === '' ? `facility-${index}` : facilityOptionId;

              return (
                <option key={facilityKey} value={facilityOptionId}>{facility.name}</option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="label">児童</label>
          {childrenLoading && <p className="child-fetch-status" role="status" aria-live="polite">取得中…</p>}
          <select
            className="input-field"
            value={toSelectValue(childId)}
            disabled={childrenLoading}
            onChange={(e) => onChildChange?.(Number(e.target.value))}
          >
            {children.map((child, index) => {
              const childOptionId = toSelectId(child, 'child_id');
              const childKey = childOptionId === '' ? `child-${index}` : childOptionId;

              return (
                <option key={childKey} value={childOptionId}>{child.name}</option>
              );
            })}
          </select>
        </div>
    </div>
  );
}
