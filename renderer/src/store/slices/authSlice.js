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
      const user = result?.user ?? result?.data?.user ?? null;
      const authenticated =
        result?.success === true &&
        result?.meta?.authenticated === true &&
        Boolean(user);

      if (!authenticated) {
        return rejectWithValue(
          result?.message || "Laravel authentication failed.",
        );
      }

      return { user: sanitizeUser(user) };
    } catch (error) {
      return rejectWithValue(
        error?.message || "Laravel authentication failed.",
      );
    }
  },
);

const sanitizeUser = (user) => {
  if (!user) return null;
  const { role_id: _oldRoleId, ...safe } = user;
  return safe;
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
      const user = action.payload?.user ?? null;
      const authenticated = Boolean(user) && action.payload?.authenticated !== false;

      state.user = sanitizeUser(user);
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
        state.user = sanitizeUser(action.payload.user);
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
