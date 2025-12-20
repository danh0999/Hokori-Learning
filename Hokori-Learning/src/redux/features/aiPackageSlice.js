// src/redux/features/aiPackageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

/* ============================================================
   API CALLS
============================================================ */

// 1) Get list AI packages (public)
export const fetchAiPackages = createAsyncThunk(
  "ai/packages/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/ai/packages");
      return res?.data?.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 2) Get my current AI package
export const fetchMyAiPackage = createAsyncThunk(
  "ai/packages/fetchMyPackage",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/ai/packages/my-package");
      return res?.data?.data || null;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 3) Fetch quota (remaining AI requests)
export const fetchAiQuota = createAsyncThunk(
  "ai/packages/fetchQuota",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/ai/packages/quota");
      return res?.data?.data?.quotas || {};
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 4) Check permission before using AI service
// ❗ CHỈ CHECK – KHÔNG MỞ MODAL
export const checkAIPermission = createAsyncThunk(
  "ai/packages/checkPermission",
  async (serviceCode, { getState, rejectWithValue }) => {
    try {
      const state = getState().aiPackage;
      let quotas = state.quota;

      if (!quotas || Object.keys(quotas).length === 0) {
        const res = await api.get("/ai/packages/quota");
        quotas = res?.data?.data?.quotas || {};
      }

      const q = quotas[serviceCode] || {
        remainingQuota: 0,
        hasQuota: false,
      };

      return {
        serviceCode,
        hasQuota: Boolean(q.hasQuota),
        remainingQuota: q.remainingQuota ?? 0,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 5) Checkout AI package
export const purchaseAiPackage = createAsyncThunk(
  "ai/packages/checkout",
  async (packageId, { rejectWithValue }) => {
    try {
      const res = await api.post("/payment/ai-package/checkout", {
        packageId: Number(packageId),
      });
      return res?.data?.data || null;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 6) Consume AI service quota
export const consumeAiServiceQuota = createAsyncThunk(
  "ai/packages/consumeService",
  async ({ serviceType, amount = 1 }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/ai/packages/services/${serviceType}/use`, {
        serviceType,
        amount,
      });
      return res?.data?.data || null;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ============================================================
   SLICE
============================================================ */

const initialState = {
  // UI modal
  showModal: false,
  serviceNeed: null,

  // Packages
  packages: [],
  packagesStatus: "idle",
  packagesError: null,

  // My package
  myPackage: null,
  myPackageStatus: "idle",
  myPackageError: null,

  // Quota
  quota: {},
  quotaStatus: "idle",
  quotaError: null,

  // Checkout
  checkoutStatus: "idle",
  checkoutError: null,
  lastCheckout: null,
};

const aiPackageSlice = createSlice({
  name: "aiPackage",
  initialState,

  reducers: {
    // FE chủ động mở modal giới thiệu gói
    openModal(state, action) {
      state.showModal = true;
      state.serviceNeed = action.payload || null;
    },

    closeModal(state) {
      state.showModal = false;
      state.serviceNeed = null;
    },

    resetAiPackageState() {
      return {
        ...initialState,
      };
    },
  },

  extraReducers: (builder) => {
    /* ================= FETCH PACKAGES ================= */
    builder
      .addCase(fetchAiPackages.pending, (state) => {
        state.packagesStatus = "loading";
      })
      .addCase(fetchAiPackages.fulfilled, (state, action) => {
        state.packagesStatus = "succeeded";
        state.packages = action.payload;
      })
      .addCase(fetchAiPackages.rejected, (state, action) => {
        state.packagesStatus = "failed";
        state.packagesError = action.payload;
      });

    /* ================= FETCH MY PACKAGE ================= */
    builder
      .addCase(fetchMyAiPackage.pending, (state) => {
        state.myPackageStatus = "loading";
      })
      .addCase(fetchMyAiPackage.fulfilled, (state, action) => {
        state.myPackageStatus = "succeeded";
        state.myPackage = action.payload;
      })
      .addCase(fetchMyAiPackage.rejected, (state, action) => {
        state.myPackageStatus = "failed";
        state.myPackageError = action.payload;
      });

    /* ================= FETCH QUOTA ================= */
    builder
      .addCase(fetchAiQuota.pending, (state) => {
        state.quotaStatus = "loading";
      })
      .addCase(fetchAiQuota.fulfilled, (state, action) => {
        state.quotaStatus = "succeeded";
        state.quota = action.payload;
      })
      .addCase(fetchAiQuota.rejected, (state, action) => {
        state.quotaStatus = "failed";
        state.quotaError = action.payload;
      });

    /* ================= CHECK PERMISSION ================= */
    // ❗ KHÔNG mở modal ở đây nữa
    builder.addCase(checkAIPermission.fulfilled, () => {
      // intentionally empty
    });

    /* ================= CHECKOUT ================= */
    builder
      .addCase(purchaseAiPackage.pending, (state) => {
        state.checkoutStatus = "loading";
      })
      .addCase(purchaseAiPackage.fulfilled, (state, action) => {
        state.checkoutStatus = "succeeded";
        state.lastCheckout = action.payload;
      })
      .addCase(purchaseAiPackage.rejected, (state, action) => {
        state.checkoutStatus = "failed";
        state.checkoutError = action.payload;
      });

    /* ================= CONSUME QUOTA ================= */
    // (optional) update quota if BE returns new value
  },
});

export const { openModal, closeModal, resetAiPackageState } =
  aiPackageSlice.actions;

export default aiPackageSlice.reducer;
