import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

export const fetchProfile = createAsyncThunk(
  "profile/fetch",
  async (slug) => (await api.get(`/users/${encodeURIComponent(slug)}`)).data
);
export const fetchUserPosts = createAsyncThunk("profile/fetchUserPosts", async (id) => (await api.get(`/posts/user/${id}`)).data);
export const updateMyProfile = createAsyncThunk("profile/updateMy", async ({ id, formData }) => (await api.put(`/users/${id}`, formData)).data);

const slice = createSlice({
  name: "profile",
  initialState: { viewedProfile: null, ownProfile: null, loading: false, userPosts: [], userPostsLoading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchProfile.pending, (s) => {
      s.loading = true;
      s.viewedProfile = null;
      s.userPosts = [];
    })
      .addCase(fetchProfile.fulfilled, (s, a) => { s.loading = false; s.viewedProfile = a.payload; })
      .addCase(fetchProfile.rejected, (s) => { s.loading = false; })
      .addCase(fetchUserPosts.pending, (s) => { s.userPostsLoading = true; })
      .addCase(fetchUserPosts.fulfilled, (s, a) => { s.userPostsLoading = false; s.userPosts = a.payload; })
      .addCase(fetchUserPosts.rejected, (s) => { s.userPostsLoading = false; })
      .addCase(updateMyProfile.fulfilled, (s, a) => { s.ownProfile = a.payload; s.viewedProfile = a.payload; });
  },
});

export default slice.reducer;
