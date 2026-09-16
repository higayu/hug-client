import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectActiveSpaceId,
  selectSpace,
  setActiveSpaceId,
  setSpaceChild,
  setSpacePcName,
  setSpaceChildColumns,
  clearSpace,
} from '@/store/slices/chilledspaceSlice.js'

export function useChilledSpace(spaceId = null) {
  const dispatch = useDispatch()
  const activeSpaceId = useSelector(selectActiveSpaceId)
  const resolvedSpaceId = spaceId || activeSpaceId
  const space = useSelector(selectSpace(resolvedSpaceId))

  return useMemo(() => ({
    spaceId: resolvedSpaceId,
    activeSpaceId,
    childId: space?.childId ?? '',
    childName: space?.childName ?? '',
    pcName: space?.pcName ?? '',
    selectedChildColumn5: space?.selectedChildColumn5 ?? null,
    selectedChildColumn5Html: space?.selectedChildColumn5Html ?? null,
    selectedChildColumn6: space?.selectedChildColumn6 ?? null,
    selectedChildColumn6Html: space?.selectedChildColumn6Html ?? null,
    setActive: () => dispatch(setActiveSpaceId(resolvedSpaceId)),
    setChild: (childId, childName = '') => dispatch(setSpaceChild({
      spaceId: resolvedSpaceId,
      childId,
      childName,
    })),
    setPcName: (pcName = '') => dispatch(setSpacePcName({
      spaceId: resolvedSpaceId,
      pcName,
    })),
    setChildColumns: (columns = {}) => dispatch(setSpaceChildColumns({
      spaceId: resolvedSpaceId,
      ...columns,
    })),
    clear: () => dispatch(clearSpace(resolvedSpaceId)),
  }), [
    dispatch,
    resolvedSpaceId,
    activeSpaceId,
    space,
  ])
}

export default useChilledSpace
