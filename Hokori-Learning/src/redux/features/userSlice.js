import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: { info: null },
  reducers: {
    setUser: (state, action) => {
      state.info = action.payload;
    },
    clearUser: (state) => {
      state.info = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
