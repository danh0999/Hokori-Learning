import { combineReducers } from "@reduxjs/toolkit";
import userReducer from "./features/userSlice.js";
const rootReducer = combineReducers({
  user: userReducer,
});
export default rootReducer;
