// src/redux/features/aiPackageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

/* ============================================================
   1) GET LIST PACKAGES
============================================================ */
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

/* ============================================================
   2) GET MY PACKAGE
============================================================ */
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

/* ============================================================
   3) GET QUOTA (tổng & còn lại cho từng dịch vụ)
============================================================ */
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

/* ============================================================
   4) CHECK PERMISSION CHO 1 SERVICE (AISidebar dùng)
   - Nếu không còn quota → slice mở modal mua gói
============================================================ */
export const checkAIPermission = createAsyncThunk(
  "ai/packages/checkPermission",
  async (serviceCode, { rejectWithValue }) => {
    try {
      const res = await api.get("/ai/packages/quota");
      const quotas = res?.data?.data?.quotas || {};
      const q = quotas[serviceCode] || {
        remainingQuota: 0,
        totalQuota: 0,
        hasQuota: false,
      };

      return {
        serviceCode,
        hasQuota: q.hasQuota,
        remainingQuota: q.remainingQuota,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ============================================================
   5) CHECKOUT / PURCHASE GÓI AI
   - FREE: paymentLink = null → kích hoạt ngay
   - PAID: paymentLink != null → redirect PayOS
============================================================ */
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

/* ============================================================
   6) CONSUME SERVICE QUOTA (TRỪ QUOTA)
   - Đặt tên KHÔNG bắt đầu bằng "use" để tránh rule-of-hooks
============================================================ */
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

  // list packages
  packages: [],
  packagesStatus: "idle",
  packagesError: null,

  // my package
  myPackage: null,
  myPackageStatus: "idle",
  myPackageError: null,

  // quota map: { GRAMMAR: {...}, KAIWA: {...}, ... }
  quota: {},
  quotaStatus: "idle",
  quotaError: null,

  // checkout
  checkoutStatus: "idle",
  checkoutError: null,
  lastCheckout: null,
};

const aiPackageSlice = createSlice({
  name: "aiPackage",
  initialState,
  reducers: {
    closeModal(state) {
      state.showModal = false;
      state.serviceNeed = null;
    },
  },
  extraReducers: (builder) => {
    /* ========== fetchAiPackages ========== */
    builder
      .addCase(fetchAiPackages.pending, (state) => {
        state.packagesStatus = "loading";
        state.packagesError = null;
      })
      .addCase(fetchAiPackages.fulfilled, (state, action) => {
        state.packagesStatus = "succeeded";
        state.packages = action.payload;
      })
      .addCase(fetchAiPackages.rejected, (state, action) => {
        state.packagesStatus = "failed";
        state.packagesError = action.payload || action.error;
      });

    /* ========== fetchMyAiPackage ========== */
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
        state.myPackageError = action.payload || action.error;
      });

    /* ========== fetchAiQuota ========== */
    builder
      .addCase(fetchAiQuota.pending, (state) => {
        state.quotaStatus = "loading";
        state.quotaError = null;
      })
      .addCase(fetchAiQuota.fulfilled, (state, action) => {
        state.quotaStatus = "succeeded";
        state.quota = action.payload;
      })
      .addCase(fetchAiQuota.rejected, (state, action) => {
        state.quotaStatus = "failed";
        state.quotaError = action.payload || action.error;
      });

    /* ========== checkAIPermission ========== */
    builder.addCase(checkAIPermission.fulfilled, (state, action) => {
      const { hasQuota, serviceCode } = action.payload;
      if (!hasQuota) {
        state.showModal = true;
        state.serviceNeed = serviceCode;
      }
    });

    /* ========== purchaseAiPackage (checkout) ========== */
    builder
      .addCase(purchaseAiPackage.pending, (state) => {
        state.checkoutStatus = "loading";
        state.checkoutError = null;
      })
      .addCase(purchaseAiPackage.fulfilled, (state, action) => {
        state.checkoutStatus = "succeeded";
        state.lastCheckout = action.payload;
      })
      .addCase(purchaseAiPackage.rejected, (state, action) => {
        state.checkoutStatus = "failed";
        state.checkoutError = action.payload || action.error;
      });

    /* ========== consumeAiServiceQuota ========== */
    // Nếu muốn, có thể update state.quota ở đây từ payload
  },
});

export const { closeModal } = aiPackageSlice.actions;
export default aiPackageSlice.reducer;
