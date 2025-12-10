// src/redux/features/profileSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../configs/axios";
import { toast } from "react-toastify";

/* ======================================================
   Helper: build absolute URL cho file (avatar, ...)
======================================================= */
const buildFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  const apiBase = api.defaults.baseURL || "";
  const host = apiBase.replace(/\/api\/?$/, "");
  return `${host}${path}`;
};

/* ======================================================
   FETCH CURRENT USER PROFILE
======================================================= */
export const fetchMe = createAsyncThunk(
  "profile/fetchMe",
  async (_, thunkAPI) => {
    try {
      const res = await api.get("profile/me");
      return res.data?.data || {};
    } catch {
      return thunkAPI.rejectWithValue("Không thể tải hồ sơ người dùng.");
    }
  }
);

/* ======================================================
   UPDATE CURRENT USER PROFILE
======================================================= */
export const updateMe = createAsyncThunk(
  "profile/updateMe",
  async (payload, thunkAPI) => {
    try {
      const res = await api.put("profile/me", payload);
      toast.success(" Cập nhật hồ sơ thành công!");
      return res.data?.data; // PHẢI DÙNG DỮ LIỆU BE
    } catch {
      toast.error(" Không thể cập nhật hồ sơ.");
      return thunkAPI.rejectWithValue("Cập nhật thất bại");
    }
  }
);

/* ======================================================
   CHANGE PASSWORD
======================================================= */
export const changePassword = createAsyncThunk(
  "profile/changePassword",
  async ({ currentPassword, newPassword, confirmPassword }, thunkAPI) => {
    try {
      const res = await api.put("profile/me/password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success(" Đổi mật khẩu thành công!");
      return res.data;
    } catch {
      toast.error(" Không thể đổi mật khẩu. Kiểm tra lại thông tin.");
      return thunkAPI.rejectWithValue("Đổi mật khẩu thất bại");
    }
  }
);

/* ======================================================
   UPLOAD AVATAR
======================================================= */
export const uploadAvatar = createAsyncThunk(
  "profile/uploadAvatar",
  async (file, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("profile/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const rawAvatar = res.data?.avatarUrl || res.data?.avatar_url;
      toast.success(" Cập nhật ảnh đại diện thành công!");
      return rawAvatar;
    } catch {
      toast.error(" Không thể cập nhật avatar.");
      return thunkAPI.rejectWithValue("Upload avatar failed");
    }
  }
);

/* ======================================================
   SLICE
======================================================= */
const initialState = {
  data: null,
  loading: false,
  saving: false,
  error: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    resetProfile: (state) => {
      state.data = null;
      state.loading = false;
      state.saving = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      /* ===== FETCH ME ===== */
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;

        const u = action.payload || {};
        const rawAvatar = u.avatarUrl || u.avatar_url;

        state.data = {
          id: u.id,
          email: u.email,
          username: u.username,
          displayName: u.displayName || u.display_name || u.username,
          avatarUrl: buildFileUrl(rawAvatar),
          phoneNumber: u.phoneNumber || u.phone_number || "",
          nativeLanguage: u.nativeLanguage || u.native_language || "VI",
          learningLanguage: u.learningLanguage || u.learning_language || "JA",
          country: u.country || "",
          roleName: u.roleName || "Học viên",
          isVerified: u.isVerified || false,
          isActive: u.isActive ?? true,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
        };
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ===== UPDATE PROFILE ===== */
      .addCase(updateMe.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateMe.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload || {};

        const rawAvatar =
          updated.avatarUrl || updated.avatar_url || state.data?.avatarUrl;

        // Không merge state.data cũ → dùng dữ liệu BE trả về
        state.data = {
          ...state.data, // giữ những field BE không trả về
          ...updated,    // override bằng dữ liệu mới từ BE
          avatarUrl: buildFileUrl(rawAvatar),
        };
      })
      .addCase(updateMe.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      /* ===== UPLOAD AVATAR ===== */
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        const rawAvatar = action.payload;
        state.data = {
          ...(state.data || {}),
          avatarUrl: buildFileUrl(rawAvatar),
        };
      });
  },
});

export const { resetProfile } = profileSlice.actions;
export default profileSlice.reducer;
