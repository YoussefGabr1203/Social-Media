import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";
import { updateMyProfile } from "./profileSlice";

const persisted = JSON.parse(localStorage.getItem("auth") || "{}");

export const login = createAsyncThunk("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const { email, password } = payload;
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || "Login failed");
  }
});

export const refreshCurrentUser = createAsyncThunk("auth/refreshMe", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/auth/me");
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || "Could not refresh profile");
  }
});

export const register = createAsyncThunk("auth/register", async (payload, { rejectWithValue }) => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("auth");
    const { username, email, password, fullName } = payload;
    const body = { username, email, password };
    if (fullName) body.fullName = fullName;
    const { data } = await api.post("/auth/register", body);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || "Registration failed");
  }
});

const slice = createSlice({
  name: "auth",
  initialState: { user: persisted.user || null, token: persisted.token || localStorage.getItem("token") || null, loading: false, error: null },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("auth");
    },
  },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; localStorage.setItem("token", a.payload.token); })
      .addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error.message; })
      .addCase(register.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(register.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; localStorage.setItem("token", a.payload.token); })
      .addCase(register.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error.message; })
      .addCase(updateMyProfile.fulfilled, (s, a) => { s.user = a.payload; })
      .addCase(refreshCurrentUser.fulfilled, (s, a) => { s.user = a.payload; });
  },
});

export const { logout } = slice.actions;
export default slice.reducer;
