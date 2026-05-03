import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import postsReducer from "./postsSlice";
import profileReducer from "./profileSlice";
import notifReducer from "./notifSlice";
import messagesReducer from "./messagesSlice";
import uiReducer from "./uiSlice";
import friendsReducer from "./friendsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    profile: profileReducer,
    notif: notifReducer,
    messages: messagesReducer,
    ui: uiReducer,
    friends: friendsReducer,
  },
});

store.subscribe(() => {
  const state = store.getState();
  localStorage.setItem("auth", JSON.stringify({ user: state.auth.user, token: state.auth.token }));
  localStorage.setItem("theme", state.ui.theme);
});
