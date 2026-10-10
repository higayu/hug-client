import { createSlice } from '@reduxjs/toolkit';

export const MAX_SELECTED_CHILDREN = 2;
export const SIMPLE_BOARD_SPACE_PREFIX = 'simpleBoard:';
export const getSimpleBoardSpaceId = (rowId) => `${SIMPLE_BOARD_SPACE_PREFIX}${rowId}`;

const simpleBoardSlice = createSlice({
  name: 'simpleBoard',
  initialState: {
    selectedRowIds: [],
    activeSpaceId: '',
    spaces: {},
  },
  reducers: {
    toggleSelectedRow: (state, action) => {
      const rowId = action.payload;
      const index = state.selectedRowIds.indexOf(rowId);

      if (index === -1) {
        if (state.selectedRowIds.length < MAX_SELECTED_CHILDREN) {
          state.selectedRowIds.push(rowId);
          const spaceId = getSimpleBoardSpaceId(rowId);
          state.spaces[spaceId] = { childId: '', childName: '', activeFanContentPanel: 'ai' };
          state.activeSpaceId = spaceId;
        }
      } else {
        state.selectedRowIds.splice(index, 1);
        const spaceId = getSimpleBoardSpaceId(rowId);
        delete state.spaces[spaceId];
        if (state.activeSpaceId === spaceId) {
          state.activeSpaceId = state.selectedRowIds.length
            ? getSimpleBoardSpaceId(state.selectedRowIds[0]) : '';
        }
      }
    },
    clearSelectedRows: (state) => {
      state.selectedRowIds = [];
      state.spaces = {};
      state.activeSpaceId = '';
    },
    syncSelectedChildren: (state, action) => {
      for (const row of action.payload) {
        const space = state.spaces[getSimpleBoardSpaceId(row.rId)];
        if (!space) continue;
        space.childId = row.childId;
        space.childName = row.name;
      }
    },
    setSpaceChildColumns: (state, action) => {
      const { spaceId, column5, column5Html, column6, column6Html } = action.payload;
      const space = state.spaces[spaceId];
      if (!space) return;
      space.selectedChildColumn5 = column5 ?? null;
      space.selectedChildColumn5Html = column5Html ?? null;
      space.selectedChildColumn6 = column6 ?? null;
      space.selectedChildColumn6Html = column6Html ?? null;
    },
    setActiveSpaceId: (state, action) => {
      if (state.spaces[action.payload]) state.activeSpaceId = action.payload;
    },
    setSpaceActiveFanContentPanel: (state, action) => {
      const { spaceId, panelId } = action.payload;
      if (state.spaces[spaceId] && ['ai', 'child-kadai', 'personal-record'].includes(panelId)) {
        state.spaces[spaceId].activeFanContentPanel = panelId;
      }
    },
  },
});

export const {
  toggleSelectedRow, clearSelectedRows, syncSelectedChildren,
  setActiveSpaceId, setSpaceActiveFanContentPanel,
  setSpaceChildColumns,
} = simpleBoardSlice.actions;
export const selectSelectedRowIds = (state) => state.simpleBoard.selectedRowIds;
export const selectActiveSpaceId = (state) => state.simpleBoard.activeSpaceId;
export const selectSpace = (spaceId) => (state) => state.simpleBoard.spaces[spaceId];
export const selectSpaceChildId = (spaceId) => (state) =>
  state.simpleBoard.spaces[spaceId]?.childId ?? '';
export const selectSpaceActiveFanContentPanel = (spaceId) => (state) =>
  state.simpleBoard.spaces[spaceId]?.activeFanContentPanel ?? 'ai';
export default simpleBoardSlice.reducer;
