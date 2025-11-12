import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios"; // axios instance đã cấu hình sẵn baseURL

// =============================================================
// ========== ASYNC ACTIONS (API thật) ==========================
// =============================================================

// 🧠 Fetch toàn bộ khóa học đã publish
export const fetchCourses = createAsyncThunk(
  "courses/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/courses"); // ✅ Endpoint: /api/courses
      // Giả sử backend trả về { data: [...] } hoặc mảng trực tiếp
      return response.data.data || response.data;
    } catch (err) {
      console.error("❌ Error fetching courses:", err);
      return rejectWithValue(
        err.response?.data?.message || "Lỗi khi tải danh sách khóa học."
      );
    }
  }
);

// 🧠 Fetch chi tiết 1 khóa học theo id
export const fetchCourseById = createAsyncThunk(
  "courses/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/courses/${id}`);
      return response.data.data || response.data;
    } catch (err) {
      console.error("❌ Error fetching course by id:", err);
      return rejectWithValue(
        err.response?.data?.message || "Không thể tải khóa học."
      );
    }
  }
);

// =============================================================
// ========== SLICE SETUP ======================================
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
      // ===== Fetch all =====
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.courses || [];
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ===== Fetch by id =====
      .addCase(fetchCourseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentCourse, setCurrentCourse } = courseSlice.actions;
export default courseSlice.reducer;
