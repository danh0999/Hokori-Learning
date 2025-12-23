import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// =======================================================================
//  FETCH ALL COURSES — GET /api/courses
// ========================================================================
export const fetchCourses = createAsyncThunk(
  "courses/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      let page = 0;
      const size = 20; // đúng với BE
      let allCourses = [];

      while (true) {
        const res = await api.get(`courses?page=${page}&size=${size}`);
        const data = res.data;

        if (!data || !Array.isArray(data.content)) break;

        allCourses = allCourses.concat(data.content);

        if (page >= data.totalPages - 1) break;
        page++;
      }

      return allCourses;
    } catch (err) {
      console.error("❌ Error fetching courses:", err);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải danh sách khóa học."
      );
    }
  }
);

// ========================================================================
//  FETCH COURSE TREE — GET /api/courses/{id}/tree
// ========================================================================
export const fetchCourseTree = createAsyncThunk(
  "courses/fetchCourseTree",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`courses/${id}/tree`);
      return res.data;
    } catch (err) {
      console.error("❌ Error fetching course tree:", err);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải dữ liệu khóa học."
      );
    }
  }
);

// ========================================================================
//  FETCH TRIAL TREE — GET /api/courses/{id}/trial-tree
// ========================================================================
export const fetchTrialTree = createAsyncThunk(
  "courses/fetchTrialTree",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`courses/${id}/trial-tree`);
      return res.data;
    } catch (err) {
      console.error("❌ Error fetching trial tree:", err);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải nội dung học thử."
      );
    }
  }
);

// ========================================================================
//  FETCH TRIAL LESSON DETAIL — GET /api/courses/lessons/{lessonId}/trial-detail
// ========================================================================
export const fetchTrialLessonDetail = createAsyncThunk(
  "courses/fetchTrialLessonDetail",
  async (lessonId, { rejectWithValue }) => {
    try {
      const res = await api.get(`courses/lessons/${lessonId}/trial-detail`);
      return res.data;
    } catch (err) {
      console.error("❌ Error fetching trial lesson detail:", err);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải bài học thử."
      );
    }
  }
);

// ========================================================================
//  FETCH TRIAL LESSON CONTENTS — GET /api/courses/lessons/{lessonId}/trial-contents
// ========================================================================
export const fetchTrialLessonContents = createAsyncThunk(
  "courses/fetchTrialLessonContents",
  async (lessonId, { rejectWithValue }) => {
    try {
      const res = await api.get(`courses/lessons/${lessonId}/trial-contents`);
      return res.data;
    } catch (err) {
      console.error("❌ Error fetching trial contents:", err);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải nội dung học thử."
      );
    }
  }
);

// ========================================================================
//  SLICE
// ========================================================================
const courseSlice = createSlice({
  name: "courses",
  initialState: {
    list: [],
    current: null,
    loading: false,
    error: null,
    trialTree: null,
    trialLesson: null,
    trialContents: [],
  },

  reducers: {
    clearCurrentCourse: (state) => {
      state.current = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ============================================
      //  FETCH ALL COURSES
      // ============================================
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ============================================
      //  FETCH COURSE DETAIL TREE
      // ============================================
      .addCase(fetchCourseTree.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.current = null;
      })
      .addCase(fetchCourseTree.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload; // full detail
      })
      .addCase(fetchCourseTree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ===========================
      // TRIAL TREE
      // ===========================
      .addCase(fetchTrialTree.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.trialTree = null;
      })
      .addCase(fetchTrialTree.fulfilled, (state, action) => {
        state.loading = false;
        state.trialTree = action.payload;
      })
      .addCase(fetchTrialTree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ===========================
      // TRIAL LESSON DETAIL
      // ===========================
      .addCase(fetchTrialLessonDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.trialLesson = null;
      })
      .addCase(fetchTrialLessonDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.trialLesson = action.payload;
      })
      .addCase(fetchTrialLessonDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ===========================
      // TRIAL LESSON CONTENTS
      // ===========================
      .addCase(fetchTrialLessonContents.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.trialContents = [];
      })
      .addCase(fetchTrialLessonContents.fulfilled, (state, action) => {
        state.loading = false;
        state.trialContents = action.payload;
      })
      .addCase(fetchTrialLessonContents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentCourse } = courseSlice.actions;
export default courseSlice.reducer;
