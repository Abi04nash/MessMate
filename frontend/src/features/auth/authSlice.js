import { createSlice } from "@reduxjs/toolkit";
import { api } from "../../app/api.js";

const initialState = { user: null, hydrated: false };

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) { state.user = action.payload; state.hydrated = true; },
    clearUser(state) { state.user = null; state.hydrated = true; }
  },
  extraReducers: (b) => {
    b.addMatcher(api.endpoints.login.matchFulfilled, (state, action) => {
      state.user = action.payload?.data?.user || null;
      state.hydrated = true;
    })
    .addMatcher(api.endpoints.login.matchRejected, (state) => {
      state.hydrated = true;  // don't overwrite user if login failed but old session valid
    })
    .addMatcher(api.endpoints.me.matchFulfilled, (state, action) => {
      state.user = action.payload?.data?.user || null;
      state.hydrated = true;
    })
    .addMatcher(api.endpoints.me.matchRejected, (state) => {
      // Session invalid ' clear user
      state.user = null;
      state.hydrated = true;
    })
    .addMatcher(api.endpoints.logout.matchFulfilled, (state) => {
      state.user = null;
      state.hydrated = true;
    });
  }
});

export const { setUser, clearUser } = slice.actions;
export default slice.reducer;