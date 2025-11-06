import { combineReducers } from "@reduxjs/toolkit";
import userReducer from "./features/userSlice.js";
import teacherProfileReducer from "./features/teacherprofileSlice.js";
import profileReducer from "./features/profileSlice.js";
import policiesSlice from "./features/policiesSlice.js";
const rootReducer = combineReducers({
  user: userReducer,
  teacherProfile: teacherProfileReducer,
  profile: profileReducer,
  policies: policiesSlice,
});
export default rootReducer;
