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
import flashcardLearnerReducer from "./features/flashcardLearnerSlice.js";
import progressSlice from "./features/progressSlice.js";
import walletReducer from "./features/walletSlice.js";
import jlptModeratorReducer from "./features/jlptModeratorSlice.js";
import aiPackageReducer from "./features/aiPackageSlice.js";

import jlptLearnerReducer from "./features/jlptLearnerSlice.js";

import quizAttemptreducer from "./features/quizAttemptSlice.js";

const rootReducer = combineReducers({
  user: userReducer,
  teacherProfile: teacherProfileReducer,
  profile: profileReducer,
  policies: policiesSlice,
  cart: cartSlice,
  courses: courseSlice,
  jlptLearner: jlptLearnerReducer,
  teacherCourse: teacherCourseReducer,
  quiz: quizReducer,
  quizAttempt: quizAttemptreducer,

  flashcards: flashcardLearnerReducer,
  flashcardTeacher: flashcardReducer,
  aiPackage: aiPackageReducer,
  progress: progressSlice,
  wallet: walletReducer,
  jlptModerator: jlptModeratorReducer,
});

export default rootReducer;
