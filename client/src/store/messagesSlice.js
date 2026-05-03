import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

export const fetchConversations = createAsyncThunk("messages/fetchConversations", async () => (await api.get("/conversations")).data);
export const fetchMessages = createAsyncThunk("messages/fetchMessages", async ({ id, page = 1 }) => ({ id, page, data: (await api.get(`/conversations/${id}/messages?page=${page}&limit=20`)).data }));

const slice = createSlice({
  name: "messages",
  initialState: { conversations: [], activeConversationId: null, activeMessages: [] },
  reducers: {
    setActiveConversation(state, a) { state.activeConversationId = a.payload; state.activeMessages = []; },
    appendMessage(state, a) { state.activeMessages.push(a.payload); },
  },
  extraReducers: (b) => {
    b.addCase(fetchConversations.fulfilled, (s, a) => { s.conversations = a.payload; })
      .addCase(fetchMessages.fulfilled, (s, a) => { s.activeMessages = a.payload.page === 1 ? a.payload.data : [...a.payload.data, ...s.activeMessages]; });
  },
});

export const { setActiveConversation, appendMessage } = slice.actions;
export default slice.reducer;
