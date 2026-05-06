import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

export const fetchNotifications = createAsyncThunk("notif/fetch", async () => (await api.get("/notifications")).data);

const slice = createSlice({
  name: "notif",
  initialState: { notifications: [], unreadCount: 0 },
  reducers: {
    removeNotification(state, action) {
      state.notifications = state.notifications.filter((n) => n._id !== action.payload);
      state.unreadCount = state.notifications.filter((n) => !n.read).length;
    },
    clearNotifications(state) {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchNotifications.fulfilled, (s, a) => {
      s.notifications = a.payload;
      s.unreadCount = a.payload.filter((n) => !n.read).length;
    });
  },
});

export const { removeNotification, clearNotifications } = slice.actions;
export default slice.reducer;
