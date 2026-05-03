import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

export const fetchFeed = createAsyncThunk("posts/fetchFeed", async ({ page = 1 } = {}) => ({ page, data: (await api.get(`/posts?page=${page}&limit=10`)).data }));
export const createPost = createAsyncThunk("posts/createPost", async (formData) => (await api.post("/posts", formData)).data);

const slice = createSlice({
  name: "posts",
  initialState: { feed: [], singlePost: null, page: 1, loading: false },
  reducers: {
    optimisticLike(state, a) {
      const post = state.feed.find((p) => p._id === a.payload.postId);
      if (post) {
        const liked = post.likes.some((l) => (l.user?._id || l.user) === a.payload.userId);
        if (liked) post.likes = post.likes.filter((l) => (l.user?._id || l.user) !== a.payload.userId);
        else post.likes.push({ user: a.payload.userId });
      }
    },
    optimisticComment(state, a) {
      const post = state.feed.find((p) => p._id === a.payload.postId);
      if (post) post.comments.push(a.payload.comment);
    },
    removePostFromFeed(state, a) {
      state.feed = state.feed.filter((p) => p._id !== a.payload);
    },
    removeCommentFromPost(state, a) {
      const { postId, commentId } = a.payload;
      const post = state.feed.find((p) => p._id === postId);
      if (post) post.comments = post.comments.filter((c) => c._id !== commentId);
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchFeed.pending, (s) => { s.loading = true; })
      .addCase(fetchFeed.fulfilled, (s, a) => { s.loading = false; s.page = a.payload.page; s.feed = a.payload.page === 1 ? a.payload.data : [...s.feed, ...a.payload.data]; })
      .addCase(createPost.fulfilled, (s, a) => { s.feed.unshift(a.payload); });
  },
});

export const { optimisticLike, optimisticComment, removePostFromFeed, removeCommentFromPost } = slice.actions;
export default slice.reducer;
