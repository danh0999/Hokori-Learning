import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

const getError = (err) =>
  err?.response?.data?.message || err.message || "Something went wrong";

// GET flagged list
export const fetchFlaggedCoursesThunk = createAsyncThunk(
  "moderatorCourse/fetchFlaggedCourses",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("moderator/courses/flagged");
      return res.data?.data ?? res.data ?? [];
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// PUT flag course → change status = FLAGGED
export const moderatorFlagCourseThunk = createAsyncThunk(
  "moderatorCourse/flagCourse",
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await api.put(`moderator/courses/${courseId}/flag`);
      return res.data?.data ?? res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

const slice = createSlice({
  name: "moderatorCourse",
  initialState: {
    flaggedList: [],
    loadingFlagged: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlaggedCoursesThunk.pending, (state) => {
        state.loadingFlagged = true;
      })
      .addCase(fetchFlaggedCoursesThunk.fulfilled, (state, action) => {
        state.loadingFlagged = false;
        state.flaggedList = action.payload;
      })
      .addCase(fetchFlaggedCoursesThunk.rejected, (state, action) => {
        state.loadingFlagged = false;
        state.error = action.payload;
      })
      .addCase(moderatorFlagCourseThunk.fulfilled, (state) => {
        // Không làm gì ở đây cũng được vì FE sẽ refetch list sau khi flag thành công
      })
      .addCase(moderatorFlagCourseThunk.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default slice.reducer;
