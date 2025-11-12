import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

/**
 * ========== Thunk 1 ==========
 * Lấy danh sách khóa học của học viên (đã ghi danh)
 * -> dùng cho Dashboard và MyCourses
 */
export const fetchCoursesProgress = createAsyncThunk(
  "progress/fetchCoursesProgress",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/learner/courses");
      return res.data?.data || [];
    } catch (err) {
      console.error("❌ fetchCoursesProgress error:", err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/**
 * ========== Thunk 2 ==========
 * Cập nhật tiến độ của 1 content (video, quiz, reading...)
 * -> dùng trong trang học chi tiết
 */
export const updateContentProgress = createAsyncThunk(
  "progress/updateContentProgress",
  async ({ contentId, payload }, { rejectWithValue }) => {
    try {
      const res = await api.patch(
        `/learner/contents/${contentId}/progress`,
        payload
      );
      return res.data;
    } catch (err) {
      console.error("❌ updateContentProgress error:", err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/**
 * ========== Slice ==========
 */
const progressSlice = createSlice({
  name: "progress",
  initialState: {
    courses: [],
    overall: 0,
    jlptLevels: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearProgress: (state) => {
      state.courses = [];
      state.overall = 0;
      state.jlptLevels = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // === fetchCoursesProgress ===
      .addCase(fetchCoursesProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoursesProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;

        // 👉 Tính tổng thể & theo level
        if (action.payload.length > 0) {
          const list = action.payload;

          // Tính overall %
          const overall = Math.round(
            list.reduce((sum, c) => sum + (c.progress || 0), 0) / list.length
          );
          state.overall = overall;

          // Gom theo level
          const byLevel = {};
          list.forEach((c) => {
            const lvl = c.level || "Unknown";
            if (!byLevel[lvl]) byLevel[lvl] = [];
            byLevel[lvl].push(c.progress || 0);
          });

          const jlptLevels = Object.entries(byLevel).map(([level, arr]) => {
            const avg = arr.reduce((s, v) => s + v, 0) / arr.length;
            return {
              level: `JLPT ${level}`,
              progress: Math.round(avg),
              status:
                avg === 0
                  ? "Chưa bắt đầu"
                  : avg === 100
                  ? "Hoàn thành"
                  : "Đang học",
            };
          });
          state.jlptLevels = jlptLevels;
        }
      })
      .addCase(fetchCoursesProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể tải tiến độ học";
      })

      // === updateContentProgress ===
      .addCase(updateContentProgress.fulfilled, (state, action) => {
        console.log("✅ Content progress updated:", action.payload);
      });
  },
});

export const { clearProgress } = progressSlice.actions;
export default progressSlice.reducer;
