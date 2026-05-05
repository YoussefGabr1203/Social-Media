import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import postsReducer from "./postsSlice";
import profileReducer from "./profileSlice";
import notifReducer from "./notifSlice";
import messagesReducer from "./messagesSlice";
import uiReducer from "./uiSlice";
import friendsReducer from "./friendsSlice";
import { logout } from "./authSlice";

const combinedReducer = combineReducers({
  auth: authReducer,
  posts: postsReducer,
  profile: profileReducer,
  notif: notifReducer,
  messages: messagesReducer,
  ui: uiReducer,
  friends: friendsReducer,
});

// On logout, reset every slice to its initialState so no account's data
// is ever visible to the next user. UI (theme) is preserved intentionally.
const rootReducer = (state, action) => {
  if (action.type === logout.type) {
    return combinedReducer({ ui: state?.ui }, action);
  }
  return combinedReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

store.subscribe(() => {
  const state = store.getState();
  localStorage.setItem("auth", JSON.stringify({ user: state.auth.user, token: state.auth.token }));
  localStorage.setItem("theme", state.ui.theme);
});
