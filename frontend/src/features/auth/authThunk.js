import { createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = import.meta.env.VITE_DJANGO_URL;

// Exchange the refresh token for a fresh access token. Writes the new tokens
// to localStorage so the shared `request()` helper in utils/api.js (used by
// every other API call) stays in sync. Returns the new tokens, or null when
// the refresh token is missing/invalid/expired.
async function refreshAccessToken(refresh) {
  if (!refresh) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.access) return null;
    const newTokens = {
      access: data.access,
      refresh: data.refresh || refresh, // SimpleJWT may rotate the refresh token
    };
    localStorage.setItem("access_token", newTokens.access);
    localStorage.setItem("refresh_token", newTokens.refresh);
    return newTokens;
  } catch {
    return null;
  }
}

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ username, password }, thunkAPI) => {
    try {
      const res = await fetch(`${BASE_URL}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return thunkAPI.rejectWithValue(
          data.detail || "Login failed"
        );
      }

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Registration does NOT auto-login (the user must sign in manually afterwards).
// On failure the backend returns DRF field errors; flatten them into a single
// string so the caller can surface it directly.
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (formData, thunkAPI) => {
    try {
      const res = await fetch(`${BASE_URL}/api/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          typeof data === "string"
            ? data
            : Object.values(data).flat().join(" ");
        return thunkAPI.rejectWithValue(msg || "Registration failed");
      }

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Resolve the logged-in user from the stored access token. Called once on app
// load (bootstrap) and again whenever the user edits their profile. If the
// access token has expired, try a single refresh + retry before giving up.
export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, thunkAPI) => {
    const { auth } = thunkAPI.getState();
    const access = auth.tokens.access;
    if (!access) return thunkAPI.rejectWithValue("No token");

    const doFetch = (token) =>
      fetch(`${BASE_URL}/api/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

    let res = await doFetch(access);

    // Access token expired — refresh once and retry.
    if (res.status === 401) {
      const refreshed = await refreshAccessToken(auth.tokens.refresh);
      if (refreshed) {
        res = await doFetch(refreshed.access);
        // Carry the refreshed tokens up to the slice so Redux state matches
        // the localStorage values we just wrote.
        if (res.ok) {
          const user = await res.json();
          return { user, tokens: refreshed };
        }
      }
      // Refresh failed or profile still unreachable — force a logout.
      return thunkAPI.rejectWithValue("Session expired");
    }

    if (!res.ok) return thunkAPI.rejectWithValue("Failed to fetch profile");

    const user = await res.json();
    return { user };
  }
);