import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// ==== FETCH PROFILE ====
export const fetchTeacherProfile = createAsyncThunk(
  "teacherProfile/fetchTeacherProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("teachers/me/profile");
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Fetch failed" }
      );
    }
  }
);

// ==== UPDATE QUALIFICATIONS ====
export const updateTeacherQualifications = createAsyncThunk(
  "teacherProfile/updateTeacherQualifications",
  async (body, { rejectWithValue }) => {
    try {
      const res = await api.put("teachers/me/qualifications", body);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Update failed" }
      );
    }
  }
);

// ==== SUBMIT APPROVAL ====
export const submitTeacherProfile = createAsyncThunk(
  "teacherProfile/submitTeacherProfile",
  async ({ message } = { message: "" }, { rejectWithValue }) => {
    try {
      const res = await api.post("teachers/me/approval", { message });
      return res?.data?.data; // profile sau khi chuyển PENDING
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || {
          message: err?.normalizedMessage || "Submit failed",
        }
      );
    }
  }
);

const initialState = {
  data: null,
  status: "idle",
  error: null,
  updating: false,
  updateError: null,
  submitting: false,
  submitError: null,
};

const teacherprofileSlice = createSlice({
  name: "teacherProfile",
  initialState,
  reducers: {
    resetTeacherProfile(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchTeacherProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTeacherProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload || null;
      })
      .addCase(fetchTeacherProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error;
      })
      // update
      .addCase(updateTeacherQualifications.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateTeacherQualifications.fulfilled, (state, action) => {
        state.updating = false;
        if (action.payload) state.data = action.payload;
      })
      .addCase(updateTeacherQualifications.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload || action.error;
      })
      // submit
      .addCase(submitTeacherProfile.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })
      .addCase(submitTeacherProfile.fulfilled, (state, action) => {
        state.submitting = false;
        if (action.payload) state.data = action.payload;
      })
      .addCase(submitTeacherProfile.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload || action.error;
      });
  },
});

export const { resetTeacherProfile } = teacherprofileSlice.actions;

export const selectTeacherProfile = (state) => state.teacherProfile?.data;
export const selectTeacherProfileStatus = (state) =>
  state.teacherProfile?.status;
export const selectTeacherProfileError = (state) => state.teacherProfile?.error;
export const selectTeacherProfileUpdating = (state) =>
  state.teacherProfile?.updating;
export const selectTeacherProfileUpdateError = (state) =>
  state.teacherProfile?.updateError;
export const selectTeacherApproved = (state) =>
  (state.teacherProfile?.data?.approvalStatus || "") === "APPROVED";
export const selectTeacherProfileSubmitting = (state) =>
  state.teacherProfile?.submitting;
export const selectTeacherProfileSubmitError = (state) =>
  state.teacherProfile?.submitError;

export default teacherprofileSlice.reducer;
