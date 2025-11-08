import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../configs/axios";
import { toast } from "react-toastify";

/* ===============================
   FETCH CURRENT USER PROFILE
================================= */
export const fetchMe = createAsyncThunk(
  "profile/fetchMe",
  async (_, thunkAPI) => {
    try {
      const res = await api.get("profile/me");
      // BE của bạn có dạng { data: { ...user } }
      return res.data?.data || {};
    } catch (err) {
      return thunkAPI.rejectWithValue("Không thể tải hồ sơ người dùng.");
    }
  }
);

/* ===============================
   UPDATE CURRENT USER PROFILE
================================= */
export const updateMe = createAsyncThunk(
  "profile/updateMe",
  async (payload, thunkAPI) => {
    try {
      const res = await api.put("profile/me", payload);
      toast.success("✅ Cập nhật hồ sơ thành công!");
      // Nếu BE trả data mới thì dùng, nếu không thì dùng payload
      return res.data?.data || payload;
    } catch (err) {
      toast.error("❌ Không thể cập nhật hồ sơ.");
      return thunkAPI.rejectWithValue("Cập nhật thất bại");
    }
  }
);

/* ===============================
   CHANGE PASSWORD
================================= */
export const changePassword = createAsyncThunk(
  "profile/changePassword",
  async ({ currentPassword, newPassword, confirmPassword }, thunkAPI) => {
    try {
      const res = await api.put("profile/me/password", {
        currentPassword,
        newPassword,
        confirmPassword, // gửi luôn cho chắc, nếu BE cần
      });
      toast.success("🔑 Đổi mật khẩu thành công!");
      return res.data;
    } catch (err) {
      toast.error("❌ Không thể đổi mật khẩu. Kiểm tra lại thông tin.");
      return thunkAPI.rejectWithValue("Đổi mật khẩu thất bại");
    }
  }
);

/* ===============================
   SLICE DEFINITION
================================= */
const initialState = {
  data: null,
  loading: false,
  saving: false,
  error: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ----- GET PROFILE -----
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        const u = action.payload || {};

        // Chuẩn hoá dữ liệu từ BE
        state.data = {
          id: u.id,
          email: u.email,
          username: u.username,
          displayName:
            u.displayName || u.display_name || u.username || "Chưa cập nhật",
          avatarUrl: u.avatarUrl || u.avatar_url || null,
          phoneNumber: u.phoneNumber || u.phone_number || "",
          nativeLanguage: u.nativeLanguage || u.native_language || "",
          learningLanguage: u.learningLanguage || u.learning_language || "JA",
          country: u.country || "",
          roleName: u.roleName || "Học viên",
          isVerified: u.isVerified || false,
          isActive: u.isActive || true,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
        };
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ----- UPDATE PROFILE -----
      .addCase(updateMe.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateMe.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload || {};

        // Merge dữ liệu cũ + mới, tránh mất field
        state.data = {
          ...(state.data || {}),
          ...updated,
        };
      })
      .addCase(updateMe.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    // changePassword không cần state riêng, vì đã toast trong thunk
  },
});

export default profileSlice.reducer;
