import { combineReducers } from "@reduxjs/toolkit";
import userReducer from "./features/userSlice.js";
import teacherProfileReducer from "./features/teacherprofileSlice.js";
import profileReducer from "./features/profileSlice.js";
const rootReducer = combineReducers({
  user: userReducer,
  teacherProfile: teacherProfileReducer,
  profile: profileReducer,
});
export default rootReducer;
