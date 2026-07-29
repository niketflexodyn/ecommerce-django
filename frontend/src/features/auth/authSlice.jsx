import { createSlice } from "@reduxjs/toolkit";
import { loginUser, registerUser, fetchProfile } from "./authThunk";

// `loading` doubles as the auth-bootstrap gate: it starts true when an access
// token is already in localStorage (we're about to verify it via fetchProfile)
// so route guards like AdminRoute can show a spinner instead of bouncing a
// logged-in user to /login on reload. It flips false once profile resolves.
const hasToken = Boolean(localStorage.getItem("access_token"));

const initialState = {
  user: null,

  tokens: {
    access: localStorage.getItem("access_token"),
    refresh: localStorage.getItem("refresh_token"),
  },

  loading: hasToken,
  error: null,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    logout(state) {
      state.user = null;
      state.tokens = { access: null, refresh: null };
      state.loading = false;
      state.error = null;

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    },

    setUser(state, action) {
      state.user = action.payload;
    },

    clearError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ── Login ──
      .addCase(loginUser.pending, (state) => {  
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.tokens = {
          access: action.payload.access,
          refresh: action.payload.refresh,
        };
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Register (no auto-login) ──
      .addCase(registerUser.pending, (state) => {
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Profile bootstrap / refresh ──
      // NOTE: pending intentionally does NOT set loading=true. `loading` is the
      // bootstrap gate; manual refreshUser() calls must not flip the route-guard
      // spinner. On app load loading is already true from initialState.
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        if (action.payload.tokens) {
          state.tokens = action.payload.tokens;
        }
        state.error = null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        if (action.payload === "Session expired") {
          state.user = null;
          state.tokens = { access: null, refresh: null };
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        } else {
          state.error = action.payload;
        }
      });
  },
});

export const { logout, setUser, clearError } = authSlice.actions;

export default authSlice.reducer;