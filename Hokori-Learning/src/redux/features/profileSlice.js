import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// === THUNKs ===
export const fetchMe = createAsyncThunk(
  "profile/fetchMe",
  async (_, thunkAPI) => {
    try {
      const res = await api.get("profile/me"); // baseURL đã có /api/
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err?.normalizedMessage || "Fetch profile failed"
      );
    }
  }
);

export const updateMe = createAsyncThunk(
  "profile/updateMe",
  async (payload, thunkAPI) => {
    try {
      const res = await api.put("profile/me", payload);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err?.normalizedMessage || "Update profile failed"
      );
    }
  }
);

export const changePassword = createAsyncThunk(
  "profile/changePassword",
  async ({ currentPassword, newPassword, confirmPassword }, thunkAPI) => {
    try {
      const res = await api.put("profile/me/password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err?.normalizedMessage || "Change password failed"
      );
    }
  }
);

// === SLICE ===
const initialState = {
  data: null,
  loading: false,
  error: null,
  saving: false,
  changingPw: false,
  pwError: null,
  pwSuccess: false,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    resetPwState(state) {
      state.changingPw = false;
      state.pwError = null;
      state.pwSuccess = false;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMe.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchMe.fulfilled, (s, a) => {
      s.loading = false;
      s.data = a.payload || null;
    });
    b.addCase(fetchMe.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload || "Error";
      s.data = null;
    });

    b.addCase(updateMe.pending, (s) => {
      s.saving = true;
      s.error = null;
    });
    b.addCase(updateMe.fulfilled, (s, a) => {
      s.saving = false;
      s.data = a.payload || s.data;
    });
    b.addCase(updateMe.rejected, (s, a) => {
      s.saving = false;
      s.error = a.payload || "Error";
    });

    b.addCase(changePassword.pending, (s) => {
      s.changingPw = true;
      s.pwError = null;
      s.pwSuccess = false;
    });
    b.addCase(changePassword.fulfilled, (s) => {
      s.changingPw = false;
      s.pwSuccess = true;
    });
    b.addCase(changePassword.rejected, (s, a) => {
      s.changingPw = false;
      s.pwError = a.payload || "Error";
    });
  },
});

export const { resetPwState } = profileSlice.actions;
export default profileSlice.reducer;
