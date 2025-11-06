import { combineReducers } from "@reduxjs/toolkit";
import userReducer from "./features/userSlice.js";
import teacherProfileReducer from "./features/teacherprofileSlice.js";
import profileReducer from "./features/profileSlice.js";
import policiesSlice from "./features/policiesSlice.js";
import cartSlice from "./features/cartSlice.js";
import courseSlice from "./features/courseSlice.js";
const rootReducer = combineReducers({
  user: userReducer,
  teacherProfile: teacherProfileReducer,
  profile: profileReducer,
  policies: policiesSlice,
  cart: cartSlice,
  courses: courseSlice,
});
export default rootReducer;
