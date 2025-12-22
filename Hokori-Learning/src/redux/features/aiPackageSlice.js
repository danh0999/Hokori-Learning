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
      // BE: { success, message, data: { totalRequests, usedRequests, remainingRequests, hasQuota } }
      return res?.data?.data || {};
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// 4) Check permission before using AI service
// ✅ CHỈ CHECK – KHÔNG MỞ MODAL (nhưng tự đảm bảo quota đã có)
export const checkAIPermission = createAsyncThunk(
  "ai/packages/checkPermission",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      let quota = getState().aiPackage.quota;

      // Nếu chưa có quota trong store → fetch realtime
      if (!quota || Object.keys(quota).length === 0) {
        quota = await dispatch(fetchAiQuota()).unwrap();
      }

      const remaining = quota?.remainingRequests ?? 0;

      return {
        hasQuota: remaining > 0,
        remainingQuota: remaining,
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
      return res?.data?.data || { used: amount };
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

  needsSync: false,
};

const aiPackageSlice = createSlice({
  name: "aiPackage",
  initialState,

  reducers: {
    openModal(state, action) {
      state.showModal = true;
      state.serviceNeed = action.payload || null;

      state.checkoutStatus = "idle";
      state.checkoutError = null;
      state.lastCheckout = null;
    },

    closeModal(state) {
      state.showModal = false;
      state.serviceNeed = null;

      state.checkoutStatus = "idle";
      state.checkoutError = null;
      state.lastCheckout = null;
    },

    resetCheckout(state) {
      state.checkoutStatus = "idle";
      state.checkoutError = null;
      state.lastCheckout = null;
    },

    clearAiPackageErrors(state) {
      state.packagesError = null;
      state.myPackageError = null;
      state.quotaError = null;
      state.checkoutError = null;
    },

    setNeedsSync(state, action) {
      state.needsSync = Boolean(action.payload);
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
        state.packagesError = null;
      })
      .addCase(fetchAiPackages.fulfilled, (state, action) => {
        state.packagesStatus = "succeeded";
        state.packages = action.payload || [];
      })
      .addCase(fetchAiPackages.rejected, (state, action) => {
        state.packagesStatus = "failed";
        state.packagesError = action.payload;
      });

    /* ================= FETCH MY PACKAGE ================= */
    builder
      .addCase(fetchMyAiPackage.pending, (state) => {
        state.myPackageStatus = "loading";
        state.myPackageError = null;
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
        state.quotaError = null;
      })
      .addCase(fetchAiQuota.fulfilled, (state, action) => {
        state.quotaStatus = "succeeded";
        state.quota = action.payload || {};
      })
      .addCase(fetchAiQuota.rejected, (state, action) => {
        state.quotaStatus = "failed";
        state.quotaError = action.payload;
      });

    /* ================= CHECK PERMISSION ================= */
    builder.addCase(checkAIPermission.fulfilled, () => {
      // intentionally empty
    });

    /* ================= CHECKOUT ================= */
    builder
      .addCase(purchaseAiPackage.pending, (state) => {
        state.checkoutStatus = "loading";
        state.checkoutError = null;
        state.lastCheckout = null;
      })
      .addCase(purchaseAiPackage.fulfilled, (state, action) => {
        state.checkoutStatus = "succeeded";
        state.lastCheckout = action.payload || null;
        state.needsSync = true;
      })
      .addCase(purchaseAiPackage.rejected, (state, action) => {
        state.checkoutStatus = "failed";
        state.checkoutError = action.payload;
      });

    /* ================= CONSUME QUOTA ================= */
    builder.addCase(consumeAiServiceQuota.fulfilled, (state, action) => {
      // Nếu BE không trả quota mới, FE tự trừ nhẹ để UI sync nhanh.
      const used = Number(action.payload?.used ?? 1);
      if (!state.quota || Object.keys(state.quota).length === 0) return;

      const total = Number(state.quota.totalRequests ?? 0);
      const remaining = Number(state.quota.remainingRequests ?? 0);
      const usedRequests = Number(state.quota.usedRequests ?? 0);

      const nextRemaining = Math.max(0, remaining - used);
      const nextUsed = usedRequests + used;

      state.quota.remainingRequests = nextRemaining;
      state.quota.usedRequests = nextUsed;
      state.quota.hasQuota = nextRemaining > 0 && total > 0;
    });
  },
});

export const {
  openModal,
  closeModal,
  resetCheckout,
  clearAiPackageErrors,
  setNeedsSync,
  resetAiPackageState,
} = aiPackageSlice.actions;

export default aiPackageSlice.reducer;
