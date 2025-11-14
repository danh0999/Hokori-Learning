import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// =============================================================
// ========== FETCH ALL COURSES (API THẬT) =======================
// =============================================================

export const fetchCourses = createAsyncThunk(
  "courses/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/courses"); 
      // Backend trả dạng Spring Pageable:
      // { content: [...], totalPages: 1, totalElements: 3, ... }

      const data = response.data;

      if (!data || !Array.isArray(data.content)) {
        console.warn("⚠ API /courses không trả về content hợp lệ:", data);
        return [];
      }

      return data.content; // ✅ lấy danh sách khóa học thực tế
    } catch (err) {
      console.error("❌ Error fetching courses:", err);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải danh sách khóa học."
      );
    }
  }
);

// =============================================================
// ========== FETCH COURSE BY ID ================================
// =============================================================

export const fetchCourseById = createAsyncThunk(
  "courses/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/courses/${id}`); 
      return response.data;
    } catch (err) {
      console.error("❌ Error fetching course by id:", err);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải khóa học."
      );
    }
  }
);

// =============================================================
// ========== SLICE =============================================
// =============================================================

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
    setCurrentCourse: (state, action) => {
      state.current = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ===== FETCH ALL =====
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload || [];
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ===== FETCH BY ID =====
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.current = action.payload;
      });
  },
});

export const { clearCurrentCourse, setCurrentCourse } = courseSlice.actions;
export default courseSlice.reducer;
