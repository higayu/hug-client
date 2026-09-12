import { configureStore } from '@reduxjs/toolkit'
import attendanceReducer from './slices/attendanceSlice.js'
import authReducer from './slices/authSlice.js'
import appStateReducer from './slices/appStateSlice.js'
import databaseReducer from './slices/databaseSlice.js'
import sendTextReducer from './slices/sendTextSlice.js'
import webviewReducer from "./slices/webviewSlice.js"
import recordStatusReducer from "./slices/recordStatusSlice.js";
import modeReducer from './slices/modeSlice.js'
import chilledspaceReducer from './slices/chilledspaceSlice.js'

export const store = configureStore({
  reducer: {
    attendance: attendanceReducer,
    auth: authReducer,
    appState: appStateReducer,
    chilledspace: chilledspaceReducer,
    database: databaseReducer,
    sendText: sendTextReducer,
    webview: webviewReducer,
    recordStatus: recordStatusReducer,
    mode: modeReducer,
  },
  devTools: process.env.NODE_ENV !== 'production'
})

export default store
