import { combineReducers } from "@reduxjs/toolkit";
import userReducer from "./features/userSlice.js";
import teacherProfileReducer from "./features/teacherprofileSlice.js";
import profileReducer from "./features/profileSlice.js";
import policiesSlice from "./features/policiesSlice.js";
import cartSlice from "./features/cartSlice.js";
import courseSlice from "./features/courseSlice.js";
import teacherCourseReducer from "./features/teacherCourseSlice.js";
import quizReducer from "./features/quizSlice.js";
import flashcardReducer from "./features/flashcardSlice.js";
import aiSpeechSlice from "./features/aiSpeechSlice.js";
import progressSlice from "./features/progressSlice.js";
import walletReducer from "./features/walletSlice.js";
const rootReducer = combineReducers({
  user: userReducer,
  teacherProfile: teacherProfileReducer,
  profile: profileReducer,
  policies: policiesSlice,
  cart: cartSlice,
  courses: courseSlice,
  teacherCourse: teacherCourseReducer,
  quiz: quizReducer,
  flashcard: flashcardReducer,
  aiSpeech: aiSpeechSlice,
  progress: progressSlice,
  wallet: walletReducer,
});
export default rootReducer;
