import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// ==== FETCH PROFILE ====
export const fetchTeacherProfile = createAsyncThunk(
  "teacherProfile/fetchTeacherProfile",
  async (_, { rejectWithValue }) => {
    try {
      // nếu bạn đang dùng /profile/me thì để như vầy:
      const res = await api.get("profile/me");
      // nếu bạn dùng /teachers/me thì đổi lại:
      // const res = await api.get("teachers/me");

      const raw = res?.data?.data || {};
      const teacher = raw.teacher || {};

      // Gộp user info + teacher info thành 1 object
      const mapped = {
        // user-level
        id: raw.id,
        email: raw.email,
        username: raw.username,
        displayName: raw.displayName,
        avatarUrl: raw.avatarUrl,
        country: raw.country,
        phoneNumber: raw.phoneNumber,
        role: raw.role,

        // teacher-level (approvalStatus, headline, bio, yearsOfExperience, ...)
        ...teacher,
      };

      return mapped;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Fetch failed" }
      );
    }
  }
);

/** ===================== CERTIFICATES (Approval) ===================== */
// GET all my certificates
export const fetchTeacherCertificates = createAsyncThunk(
  "teacherProfile/fetchTeacherCertificates",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("teacher/approval/certificates");
      return res?.data?.data || [];
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Fetch certificates failed" }
      );
    }
  }
);

// CREATE or UPDATE a certificate (upsert)
export const upsertTeacherCertificate = createAsyncThunk(
  "teacherProfile/upsertTeacherCertificate",
  async (payload, { rejectWithValue }) => {
    try {
      // nếu có id -> PUT /{id}, ngược lại POST /
      if (payload?.id) {
        const res = await api.put(
          `teacher/approval/certificates/${payload.id}`,
          payload
        );
        return res?.data?.data;
      }
      const res = await api.post("teacher/approval/certificates", payload);
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Save certificate failed" }
      );
    }
  }
);

// DELETE a certificate
export const deleteTeacherCertificate = createAsyncThunk(
  "teacherProfile/deleteTeacherCertificate",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`teacher/approval/certificates/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Delete certificate failed" }
      );
    }
  }
);

// (optional) GET latest approval request
export const fetchLatestApproval = createAsyncThunk(
  "teacherProfile/fetchLatestApproval",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("teacher/approval/latest");
      return res?.data?.data || null;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Fetch latest approval failed" }
      );
    }
  }
);

/** ===================== SUBMIT APPROVAL ===================== */
export const submitTeacherProfile = createAsyncThunk(
  "teacherProfile/submitTeacherProfile",
  async ({ message } = { message: "" }, { rejectWithValue }) => {
    try {
      // Swagger: POST /teacher/approval/submit
      const res = await api.post("teacher/approval/submit", { message });
      return res?.data?.data; // profile sau khi chuyển PENDING (tuỳ BE trả)
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || {
          message: err?.normalizedMessage || "Submit failed",
        }
      );
    }
  }
);

/** ===================== SLICE ===================== */
const initialState = {
  data: null, // teacher profile
  status: "idle",
  error: null,

  certificates: [], // approval certificates
  certStatus: "idle",
  certError: null,
  savingCert: false,
  deletingCert: false,

  latestApproval: null,
  latestStatus: "idle",
  latestError: null,

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
      // ===== PROFILE =====
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

      // ===== CERTIFICATES: list =====
      .addCase(fetchTeacherCertificates.pending, (state) => {
        state.certStatus = "loading";
        state.certError = null;
      })
      .addCase(fetchTeacherCertificates.fulfilled, (state, action) => {
        state.certStatus = "succeeded";
        state.certificates = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(fetchTeacherCertificates.rejected, (state, action) => {
        state.certStatus = "failed";
        state.certError = action.payload || action.error;
      })

      // ===== CERTIFICATES: upsert =====
      .addCase(upsertTeacherCertificate.pending, (state) => {
        state.savingCert = true;
        state.certError = null;
      })
      .addCase(upsertTeacherCertificate.fulfilled, (state, action) => {
        state.savingCert = false;
        const cert = action.payload;
        if (!cert) return;

        const idx = state.certificates.findIndex((c) => c.id === cert.id);
        if (idx >= 0) state.certificates[idx] = cert;
        else state.certificates.unshift(cert);
      })
      .addCase(upsertTeacherCertificate.rejected, (state, action) => {
        state.savingCert = false;
        state.certError = action.payload || action.error;
      })

      // ===== CERTIFICATES: delete =====
      .addCase(deleteTeacherCertificate.pending, (state) => {
        state.deletingCert = true;
        state.certError = null;
      })
      .addCase(deleteTeacherCertificate.fulfilled, (state, action) => {
        state.deletingCert = false;
        const id = action.payload;
        state.certificates = state.certificates.filter((c) => c.id !== id);
      })
      .addCase(deleteTeacherCertificate.rejected, (state, action) => {
        state.deletingCert = false;
        state.certError = action.payload || action.error;
      })

      // ===== LATEST APPROVAL =====
      .addCase(fetchLatestApproval.pending, (state) => {
        state.latestStatus = "loading";
        state.latestError = null;
      })
      .addCase(fetchLatestApproval.fulfilled, (state, action) => {
        state.latestStatus = "succeeded";
        state.latestApproval = action.payload || null;
      })
      .addCase(fetchLatestApproval.rejected, (state, action) => {
        state.latestStatus = "failed";
        state.latestError = action.payload || action.error;
      })

      // ===== SUBMIT =====
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

/** ===================== SELECTORS ===================== */
export const selectTeacherProfile = (state) => state.teacherProfile?.data;
export const selectTeacherProfileStatus = (state) =>
  state.teacherProfile?.status;
export const selectTeacherProfileError = (state) => state.teacherProfile?.error;

export const selectTeacherCertificates = (state) =>
  state.teacherProfile?.certificates || [];
export const selectTeacherCertificatesStatus = (state) =>
  state.teacherProfile?.certStatus;
export const selectTeacherCertificatesError = (state) =>
  state.teacherProfile?.certError;
export const selectSavingCertificate = (state) =>
  state.teacherProfile?.savingCert;
export const selectDeletingCertificate = (state) =>
  state.teacherProfile?.deletingCert;

export const selectLatestApproval = (state) =>
  state.teacherProfile?.latestApproval;
export const selectLatestApprovalStatus = (state) =>
  state.teacherProfile?.latestStatus;

export const selectTeacherApproved = (state) =>
  (state.teacherProfile?.data?.approvalStatus || "") === "APPROVED";

export const selectTeacherProfileSubmitting = (state) =>
  state.teacherProfile?.submitting;
export const selectTeacherProfileSubmitError = (state) =>
  state.teacherProfile?.submitError;

export default teacherprofileSlice.reducer;
