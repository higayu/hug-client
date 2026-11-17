import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const fetchLaravelAuthState = createAsyncThunk(
  "auth/fetchLaravelAuthState",
  async (_, { rejectWithValue }) => {
    try {
      const api = window.electronAPI?.laravel_auth_me;
      if (typeof api !== "function") {
        return rejectWithValue("Laravel authentication API is not available.");
      }

      const result = await api();
      const topLevelUser = result?.user ?? null;
      const dataUser = result?.data?.user ?? null;
      const user =
        topLevelUser || dataUser
          ? {
              ...(topLevelUser ?? {}),
              ...(dataUser ?? {}),
            }
          : null;
      const authenticated =
        result?.success === true &&
        result?.meta?.authenticated === true &&
        Boolean(user);

      if (!authenticated) {
        return rejectWithValue(
          result?.message || "Laravel authentication failed.",
        );
      }

      return { user: normalizeAuthUser(user) };
    } catch (error) {
      return rejectWithValue(
        error?.message || "Laravel authentication failed.",
      );
    }
  },
);

// JWT / Laravel auth_me の role_code のみを利用する。
// 旧 role_id からの権限推測は行わない。
const normalizeAuthUser = (user) => {
  if (!user || typeof user !== "object") return null;
  const { role_id: _legacyRoleId, ...rest } = user;
  return {
    ...rest,
    company_id: user.company_id ?? null,
    is_automation_enabled: user.is_automation_enabled === true,
    role_code: typeof user.role_code === "string" ? user.role_code : null,
  };
};

const initialState = {
  user: null,
  authenticated: false,
  hasAccessToken: false,
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLaravelAuthentication: (state, action) => {
      const user = normalizeAuthUser(action.payload?.user);
      const authenticated = Boolean(user) && action.payload?.authenticated !== false;

      state.user = user;
      state.authenticated = authenticated;
      state.hasAccessToken = authenticated;
      state.status = authenticated ? "authenticated" : "unauthenticated";
      state.error = null;
    },
    clearLaravelAuthentication: () => ({
      ...initialState,
      status: "unauthenticated",
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLaravelAuthState.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLaravelAuthState.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.authenticated = true;
        state.hasAccessToken = true;
        state.status = "authenticated";
        state.error = null;
      })
      .addCase(fetchLaravelAuthState.rejected, (state, action) => {
        state.user = null;
        state.authenticated = false;
        state.hasAccessToken = false;
        state.status = "unauthenticated";
        state.error = action.payload ?? action.error?.message ?? null;
      });
  },
});

export const {
  setLaravelAuthentication,
  clearLaravelAuthentication,
} = authSlice.actions;

export const selectLaravelAuth = (state) => state.auth ?? initialState;
export const selectAuthenticatedStaffId = (state) => {
  const staffId = state.auth?.user?.staff_id;
  return staffId == null ? "" : String(staffId);
};
export const selectIsLaravelAuthenticated = (state) =>
  Boolean(
    state.auth?.authenticated &&
    state.auth?.hasAccessToken &&
    state.auth?.user,
  );

export default authSlice.reducer;

// 管理者判定はLaravelが認証済みユーザーに返したrole_codeを使用する。
export const selectAuthenticatedRoleCode = (state) =>
  state.auth?.authenticated ? state.auth?.user?.role_code ?? null : null;
export const selectIsGlobalAdmin = (state) =>
  selectAuthenticatedRoleCode(state) === "admin";

// 会社単位の自動化利用可否。未認証・未取得は false。
export const selectIsCompanyAutomationEnabled = (state) =>
  selectIsLaravelAuthenticated(state) &&
  state.auth?.user?.is_automation_enabled === true;
