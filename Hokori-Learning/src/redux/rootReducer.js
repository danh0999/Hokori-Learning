import { combineReducers } from "@reduxjs/toolkit";
import userReducer from "./features/userSlice.js";
import teacherProfileReducer from "./features/teacherprofileSlice.js";
const rootReducer = combineReducers({
  user: userReducer,
  teacherProfile: teacherProfileReducer,
});
export default rootReducer;
