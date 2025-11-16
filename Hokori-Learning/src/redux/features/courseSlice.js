import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// ========================================================================
// 📌 FETCH ALL COURSES — GET /api/courses
// ========================================================================
export const fetchCourses = createAsyncThunk(
  "courses/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/courses");

      if (!res.data || !Array.isArray(res.data.content)) {
        console.warn("⚠ API /courses không trả về content hợp lệ:", res.data);
        return [];
      }

      return res.data.content; // danh sách khóa học
    } catch (err) {
      console.error("❌ Error fetching courses:", err);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải danh sách khóa học."
      );
    }
  }
);

// ========================================================================
// 📌 FETCH COURSE TREE — GET /api/courses/{id}/tree
// ========================================================================
export const fetchCourseTree = createAsyncThunk(
  "courses/fetchCourseTree",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/courses/${id}/tree`);
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
// 📌 SLICE
// ========================================================================
const courseSlice = createSlice({
  name: "courses",
  initialState: {
    list: [],
    current: null,
    loading: false,
    error: null,
  },

  reducers: {
    clearCurrentCourse: (state) => {
      state.current = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ============================================
      // 🔥 FETCH ALL COURSES
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
      // 🔥 FETCH COURSE DETAIL TREE
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
      });
  },
});

export const { clearCurrentCourse } = courseSlice.actions;
export default courseSlice.reducer;
