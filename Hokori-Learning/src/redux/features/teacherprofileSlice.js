// redux/features/teacherprofileSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios"; // nếu path dự án bạn khác thì sửa lại cho đúng

/* ================== Helpers ================== */
const extractUserPart = (rawUser = {}) => ({
  id: rawUser.id,
  email: rawUser.email,
  username: rawUser.username,
  displayName: rawUser.displayName,
  avatarUrl: rawUser.avatarUrl,
  phoneNumber: rawUser.phoneNumber,
  country: rawUser.country,
  role: rawUser.role,
  isVerified: rawUser.isVerified,
  lastLoginAt: rawUser.lastLoginAt,
  createdAt: rawUser.createdAt,
});

const extractTeacherPart = (teacher = {}) => ({
  approvalStatus: teacher.approvalStatus,
  approvedAt: teacher.approvedAt,
  currentApproveRequestId: teacher.currentApproveRequestId,

  yearsOfExperience: teacher.yearsOfExperience,
  headline: teacher.headline,
  bio: teacher.bio,
  websiteUrl: teacher.websiteUrl,
  linkedin: teacher.linkedin,

  // bank
  bankAccountNumber: teacher.bankAccountNumber,
  bankAccountName: teacher.bankAccountName,
  bankName: teacher.bankName,
  bankBranchName: teacher.bankBranchName,

  lastPayoutDate: teacher.lastPayoutDate,
});

const mergeProfile = (state, { user, teacher } = {}) => {
  if (!state.data) state.data = { user: {}, teacher: {} };
  state.data = {
    ...state.data,
    user: user
      ? { ...(state.data.user || {}), ...user }
      : state.data.user || {},
    teacher: teacher
      ? { ...(state.data.teacher || {}), ...teacher }
      : state.data.teacher || {},
  };
};

/* ================== FETCH PROFILE (user + teacher) ================== */
export const fetchTeacherProfile = createAsyncThunk(
  "teacherProfile/fetchTeacherProfile",
  async (_, { rejectWithValue }) => {
    try {
      const [userRes, teacherRes] = await Promise.all([
        api.get("profile/me"),
        api.get("profile/me/teacher").catch(() => null),
      ]);

      const rawUser = userRes?.data?.data || userRes?.data || {};

      let teacherRaw = {};
      const wrapper = teacherRes?.data?.data;
      if (wrapper) teacherRaw = wrapper.teacher || wrapper || {};
      if (!teacherRaw || Object.keys(teacherRaw).length === 0) {
        teacherRaw = rawUser.teacher || {};
      }

      return {
        user: extractUserPart(rawUser),
        teacher: extractTeacherPart(teacherRaw),
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Fetch profile failed" }
      );
    }
  }
);

/* ================== UPDATE user profile (/profile/me) ================== */
export const updateUserProfile = createAsyncThunk(
  "teacherProfile/updateUserProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.put("profile/me", payload);
      const raw = res?.data;
      const rawUser =
        raw?.data && typeof raw.data === "object" ? raw.data : raw || {};
      return extractUserPart(rawUser);
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Update user profile failed" }
      );
    }
  }
);

/* ========== UPDATE teacher section (/profile/me/teacher) ========== */
export const updateTeacherSection = createAsyncThunk(
  "teacherProfile/updateTeacherSection",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.put("profile/me/teacher", payload);
      const wrapper = res?.data?.data || {};
      const teacherRaw = wrapper.teacher || wrapper || {};
      return extractTeacherPart(teacherRaw);
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Update teacher section failed" }
      );
    }
  }
);

/* ================== UPDATE teacher bank account (/teacher/revenue/bank-account) ================== */
export const updateTeacherBankAccount = createAsyncThunk(
  "teacherProfile/updateTeacherBankAccount",
  async (payload, { rejectWithValue }) => {
    try {
      // BE: PUT /api/teacher/revenue/bank-account
      await api.put("teacher/revenue/bank-account", payload);

      // nhiều BE trả data null -> FE merge payload để UI cập nhật ngay
      return payload || {};
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Update bank account failed" }
      );
    }
  }
);

/* ================== CERTIFICATES (Approval) ================== */
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

export const upsertTeacherCertificate = createAsyncThunk(
  "teacherProfile/upsertTeacherCertificate",
  async (payload, { rejectWithValue }) => {
    try {
      if (payload?.id) {
        const { id, ...body } = payload;
        const res = await api.put(`teacher/approval/certificates/${id}`, body);
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

/* ================== SUBMIT APPROVAL ================== */
export const submitTeacherProfile = createAsyncThunk(
  "teacherProfile/submitTeacherProfile",
  async ({ message } = { message: "" }, { rejectWithValue }) => {
    try {
      const res = await api.post("teacher/approval/submit", { message });
      return res?.data?.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || {
          message: err?.normalizedMessage || "Submit failed",
        }
      );
    }
  }
);

export const uploadTeacherAvatar = createAsyncThunk(
  "teacherProfile/uploadAvatar",
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("profile/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const raw = res?.data || {};
      const avatarUrl =
        raw.avatarUrl || raw.data?.avatarUrl || raw.data || null;

      return avatarUrl;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Upload avatar failed" }
      );
    }
  }
);

/* ================== SLICE ================== */
const initialState = {
  data: null,
  status: "idle",
  error: null,

  certificates: [],
  certStatus: "idle",
  certError: null,
  savingCert: false,
  deletingCert: false,

  latestApproval: null,
  latestStatus: "idle",
  latestError: null,

  submitting: false,
  submitError: null,

  updatingUser: false,
  updatingTeacher: false,
  updatingBank: false,

  updateUserError: null,
  updateTeacherError: null,
  updateBankError: null,

  uploadingAvatar: false,
  uploadAvatarError: null,
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
      // fetch profile
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

      // update user
      .addCase(updateUserProfile.pending, (state) => {
        state.updatingUser = true;
        state.updateUserError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.updatingUser = false;
        mergeProfile(state, { user: action.payload || {} });
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.updatingUser = false;
        state.updateUserError = action.payload || action.error;
      })

      // update teacher section
      .addCase(updateTeacherSection.pending, (state) => {
        state.updatingTeacher = true;
        state.updateTeacherError = null;
      })
      .addCase(updateTeacherSection.fulfilled, (state, action) => {
        state.updatingTeacher = false;
        mergeProfile(state, { teacher: action.payload || {} });
      })
      .addCase(updateTeacherSection.rejected, (state, action) => {
        state.updatingTeacher = false;
        state.updateTeacherError = action.payload || action.error;
      })

      // update bank
      .addCase(updateTeacherBankAccount.pending, (state) => {
        state.updatingBank = true;
        state.updateBankError = null;
      })
      .addCase(updateTeacherBankAccount.fulfilled, (state, action) => {
        state.updatingBank = false;
        mergeProfile(state, { teacher: action.payload || {} });
      })
      .addCase(updateTeacherBankAccount.rejected, (state, action) => {
        state.updatingBank = false;
        state.updateBankError = action.payload || action.error;
      })

      // certificates
      .addCase(fetchTeacherCertificates.pending, (state) => {
        state.certStatus = "loading";
        state.certError = null;
      })
      .addCase(fetchTeacherCertificates.fulfilled, (state, action) => {
        state.certStatus = "succeeded";
        state.certificates = action.payload || [];
      })
      .addCase(fetchTeacherCertificates.rejected, (state, action) => {
        state.certStatus = "failed";
        state.certError = action.payload || action.error;
      })

      .addCase(upsertTeacherCertificate.pending, (state) => {
        state.savingCert = true;
        state.certError = null;
      })
      .addCase(upsertTeacherCertificate.fulfilled, (state, action) => {
        state.savingCert = false;
        const saved = action.payload;
        if (!saved?.id) return;
        const idx = state.certificates.findIndex((c) => c.id === saved.id);
        if (idx >= 0) state.certificates[idx] = saved;
        else state.certificates.unshift(saved);
      })
      .addCase(upsertTeacherCertificate.rejected, (state, action) => {
        state.savingCert = false;
        state.certError = action.payload || action.error;
      })

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

      // latest approval
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

      // submit approval
      .addCase(submitTeacherProfile.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })
      .addCase(submitTeacherProfile.fulfilled, (state, action) => {
        state.submitting = false;
        // nếu BE trả teacher object về thì merge lại
        const payload = action.payload;
        const teacherRaw = payload?.teacher || payload || null;
        if (teacherRaw) {
          mergeProfile(state, { teacher: extractTeacherPart(teacherRaw) });
        }
      })
      .addCase(submitTeacherProfile.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload || action.error;
      })

      // avatar
      .addCase(uploadTeacherAvatar.pending, (state) => {
        state.uploadingAvatar = true;
        state.uploadAvatarError = null;
      })
      .addCase(uploadTeacherAvatar.fulfilled, (state, action) => {
        state.uploadingAvatar = false;
        const newUrl = action.payload;
        if (!newUrl) return;
        mergeProfile(state, { user: { avatarUrl: newUrl } });
      })
      .addCase(uploadTeacherAvatar.rejected, (state, action) => {
        state.uploadingAvatar = false;
        state.uploadAvatarError = action.payload || action.error;
      });
  },
});

export const { resetTeacherProfile } = teacherprofileSlice.actions;

export const selectTeacherProfile = (state) => state.teacherProfile?.data;
export const selectTeacherProfileStatus = (state) =>
  state.teacherProfile?.status;
export const selectTeacherProfileError = (state) => state.teacherProfile?.error;

export const selectTeacherCertificates = (state) =>
  state.teacherProfile?.certificates || [];
export const selectTeacherCertificatesStatus = (state) =>
  state.teacherProfile?.certStatus;

export const selectLatestApproval = (state) =>
  state.teacherProfile?.latestApproval;

export const selectTeacherApproved = (state) =>
  (state.teacherProfile?.data?.teacher?.approvalStatus || "") === "APPROVED";

export const selectTeacherProfileSubmitting = (state) =>
  state.teacherProfile?.submitting;

export const selectUpdatingUser = (state) => state.teacherProfile?.updatingUser;
export const selectUpdatingTeacher = (state) =>
  state.teacherProfile?.updatingTeacher;
export const selectUpdatingBank = (state) => state.teacherProfile?.updatingBank;

export const selectUploadingAvatar = (state) =>
  state.teacherProfile?.uploadingAvatar;

export default teacherprofileSlice.reducer;
export const selectSavingCertificate = (state) =>
  state.teacherProfile?.savingCert;

export const selectDeletingCertificate = (state) =>
  state.teacherProfile?.deletingCert;
