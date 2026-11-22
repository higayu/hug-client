import { createSlice } from '@reduxjs/toolkit';

export const MAX_SELECTED_CHILDREN = 2;
export const SIMPLE_BOARD_SPACE_PREFIX = 'simpleBoard:';
export const isSimpleBoardSpaceId = (spaceId) =>
  typeof spaceId === 'string' && spaceId.startsWith(SIMPLE_BOARD_SPACE_PREFIX);
export const getSimpleBoardSpaceId = (rowId) => `${SIMPLE_BOARD_SPACE_PREFIX}${rowId}`;

const createSpace = () => ({
  childId: '', childName: '', pcName: '', activeFanContentPanel: 'ai',
  selectedChildColumn5: null, selectedChildColumn5Html: null,
  selectedChildColumn6: null, selectedChildColumn6Html: null,
});

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
          state.spaces[spaceId] = createSpace();
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
        if (space.childId !== row.childId) {
          Object.assign(space, createSpace());
        }
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
  // Shared panels dispatch chilledspace actions; route prefixed IDs here.
  extraReducers: (builder) => {
    builder.addMatcher(
      (action) => action.type.startsWith('chilledspace/') &&
        isSimpleBoardSpaceId(action.payload?.spaceId ?? action.payload),
      (state, action) => {
        const spaceId = action.payload?.spaceId ?? action.payload;
        const space = state.spaces[spaceId];
        if (!space) return;
        switch (action.type) {
          case 'chilledspace/setActiveSpaceId':
            state.activeSpaceId = spaceId;
            break;
          case 'chilledspace/setSpaceChild':
            Object.assign(space, createSpace(), {
              childId: String(action.payload.childId ?? ''),
              childName: action.payload.childName || '',
            });
            break;
          case 'chilledspace/setSpacePcName':
            space.pcName = action.payload.pcName || '';
            break;
          case 'chilledspace/setSpaceChildColumns':
            for (const key of ['column5', 'column5Html', 'column6', 'column6Html']) {
              space[`selectedChild${key[0].toUpperCase()}${key.slice(1)}`] = action.payload[key] ?? null;
            }
            break;
          case 'chilledspace/setSpaceActiveFanContentPanel':
            if (['ai', 'child-kadai', 'personal-record'].includes(action.payload.panelId)) {
              space.activeFanContentPanel = action.payload.panelId;
            }
            break;
          case 'chilledspace/clearSpace':
            state.spaces[spaceId] = createSpace();
            break;
        }
      },
    );
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
