import { createSlice } from "@reduxjs/toolkit";

const initialState = null;

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    
    login: (state, action) => action.payload,

    logout: () => {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token"); // thêm cho chắc
      return null; // trả về null rõ ràng
    },

    updateUser: (state, action) => {
      // Tránh spread null
      const currentState = state || {};
      return {
        ...currentState,
        ...action.payload,
        token: currentState.token, // giữ token cũ nếu có
      };
    },
  },
});

//  Export các action
export const { login, logout, updateUser } = userSlice.actions;

//  Export reducer mặc định
export default userSlice.reducer;
