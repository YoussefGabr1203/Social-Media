import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";
import { logout } from "./authSlice";

export const fetchIncoming = createAsyncThunk("friends/incoming", async () => (await api.get("/friends/incoming")).data);

export const fetchFriendStatus = createAsyncThunk("friends/status", async (slug) => {
  const { data } = await api.get(`/friends/status/${encodeURIComponent(slug)}`);
  return { slug, status: data.status, requestId: data.requestId };
});

export const sendFriendRequest = createAsyncThunk("friends/send", async (username) => {
  const { data } = await api.post("/friends/request", { targetUsername: username });
  return { username, requestId: data.requestId };
});

export const cancelFriendRequest = createAsyncThunk("friends/cancel", async (slug) => {
  await api.delete(`/friends/request/${encodeURIComponent(slug)}`);
  return slug;
});

export const acceptFriendRequest = createAsyncThunk("friends/accept", async ({ requestId, slug }) => {
  await api.post(`/friends/accept/${requestId}`);
  return { requestId, slug };
});

export const declineFriendRequest = createAsyncThunk("friends/decline", async ({ requestId, slug }) => {
  await api.post(`/friends/decline/${requestId}`);
  return { requestId, slug };
});

export const unfriendUser = createAsyncThunk("friends/unfriend", async (slug) => {
  await api.delete(`/friends/${encodeURIComponent(slug)}`);
  return slug;
});

const initialState = {
  incoming: [],
  incomingLoading: false,
  statusBySlug: {},
};

const slice = createSlice({
  name: "friends",
  initialState,
  reducers: {
    setFriendStatusForSlug(state, action) {
      const { slug, status, requestId } = action.payload;
      state.statusBySlug[slug] = { status, requestId };
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchIncoming.pending, (s) => {
      s.incomingLoading = true;
    })
      .addCase(fetchIncoming.fulfilled, (s, a) => {
        s.incomingLoading = false;
        s.incoming = a.payload;
      })
      .addCase(fetchIncoming.rejected, (s) => {
        s.incomingLoading = false;
      })
      .addCase(fetchFriendStatus.fulfilled, (s, a) => {
        const { slug, status, requestId } = a.payload;
        s.statusBySlug[slug] = { status, requestId };
      })
      .addCase(sendFriendRequest.fulfilled, (s, a) => {
        const slug = a.meta.arg;
        s.statusBySlug[slug] = { status: "pending_out", requestId: a.payload.requestId };
      })
      .addCase(cancelFriendRequest.fulfilled, (s, a) => {
        s.statusBySlug[a.payload] = { status: "none" };
      })
      .addCase(acceptFriendRequest.fulfilled, (s, a) => {
        const { requestId, slug } = a.payload;
        s.incoming = s.incoming.filter((row) => row._id.toString() !== requestId.toString());
        if (slug) s.statusBySlug[slug] = { status: "friends" };
      })
      .addCase(declineFriendRequest.fulfilled, (s, a) => {
        const { requestId, slug } = a.payload;
        s.incoming = s.incoming.filter((row) => row._id.toString() !== requestId.toString());
        if (slug) s.statusBySlug[slug] = { status: "none" };
      })
      .addCase(unfriendUser.fulfilled, (s, a) => {
        s.statusBySlug[a.payload] = { status: "none" };
      })
      .addCase(logout, () => ({ ...initialState }));
  },
});

export const { setFriendStatusForSlug } = slice.actions;
export default slice.reducer;
