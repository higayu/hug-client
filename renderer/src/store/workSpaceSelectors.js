// Resolve the state source from the space ID supplied by the parent panel.
import { isSimpleBoardSpaceId } from './slices/simpleBoardSlice.js'

export const selectSpace = (spaceId) => (state) =>
  isSimpleBoardSpaceId(spaceId)
    ? state.simpleBoard?.spaces[spaceId]
    : state.chilledspace?.spaces[spaceId]

export const selectSpaceActiveFanContentPanel = (spaceId) => (state) =>
  selectSpace(spaceId)(state)?.activeFanContentPanel ?? 'ai'

export const selectSpaceChildId = (spaceId) => (state) =>
  selectSpace(spaceId)(state)?.childId ?? ''

export const selectSpaceChildName = (spaceId) => (state) =>
  selectSpace(spaceId)(state)?.childName ?? ''

export const selectSpacePcName = (spaceId) => (state) =>
  selectSpace(spaceId)(state)?.pcName ?? ''

export const selectSpaceChildColumn5 = (spaceId) => (state) =>
  selectSpace(spaceId)(state)?.selectedChildColumn5 ?? null

export const selectSpaceChildColumn5Html = (spaceId) => (state) =>
  selectSpace(spaceId)(state)?.selectedChildColumn5Html ?? null

export const selectSpaceChildColumn6 = (spaceId) => (state) =>
  selectSpace(spaceId)(state)?.selectedChildColumn6 ?? null

export const selectSpaceChildColumn6Html = (spaceId) => (state) =>
  selectSpace(spaceId)(state)?.selectedChildColumn6Html ?? null
