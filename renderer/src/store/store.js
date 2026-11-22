import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { withAiModePolicy } from './aiModeReducer.js'

import attendanceReducer from './slices/attendanceSlice.js'
import authReducer from './slices/authSlice.js'
import appStateReducer from './slices/appStateSlice.js'
import databaseReducer from './slices/databaseSlice.js'
import modeReducer from './slices/modeSlice.js'
import recordStatusReducer from './slices/recordStatusSlice.js'
import sendTextReducer from './slices/sendTextSlice.js'
import webviewReducer from './slices/webviewSlice.js'
import chilledspaceReducer from './slices/chilledspaceSlice.js'
import webAutomationRuleReducer from './slices/webAutomationRuleSlice.js'
import simpleBoardReducer from './slices/simpleBoardSlice.js'
import aiChatReducer from './slices/aiChatSlice.js'

export const store = configureStore({
  reducer: withAiModePolicy(combineReducers({
    attendance: attendanceReducer,
    auth: authReducer,
    appState: appStateReducer,
    database: databaseReducer,
    mode: modeReducer,
    sendText: sendTextReducer,
    webview: webviewReducer,
    recordStatus: recordStatusReducer,
    chilledspace: chilledspaceReducer,
    webAutomationRules: webAutomationRuleReducer,
    aiChat: aiChatReducer,
    simpleBoard: simpleBoardReducer,
  })),

  devTools: process.env.NODE_ENV !== 'production',
})

export default store
