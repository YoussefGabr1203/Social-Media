import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

export const fetchNotifications = createAsyncThunk("notif/fetch", async () => (await api.get("/notifications")).data);

const slice = createSlice({
  name: "notif",
  initialState: { notifications: [], unreadCount: 0 },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchNotifications.fulfilled, (s, a) => {
      s.notifications = a.payload;
      s.unreadCount = a.payload.filter((n) => !n.read).length;
    });
  },
});

export default slice.reducer;
