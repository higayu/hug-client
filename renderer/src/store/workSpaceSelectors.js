import { SIMPLE_BOARD_SPACE_PREFIX } from './slices/simpleBoardSlice.js';

// 共通パネルは渡された作業スペースに対応する児童を参照する。
export const selectSpace = (spaceId) => (state) => {
  const spaces = String(spaceId ?? '').startsWith(SIMPLE_BOARD_SPACE_PREFIX)
    ? state.simpleBoard.spaces
    : state.chilledspace.spaces;
  return spaces[spaceId];
};

export const selectSpaceChildId = (spaceId) => (state) =>
  selectSpace(spaceId)(state)?.childId ?? '';
