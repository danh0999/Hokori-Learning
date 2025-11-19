import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// ====================== MOCK API ======================
// check quota
export const checkAIPermission = createAsyncThunk(
  "ai/checkPermission",
  async (serviceCode) => {
    // Tạm return mock (BE chưa có)
    return {
      hasPackage: false,
      quotaLeft: 0,
      serviceCode,
    };
  }
);

// purchase package
export const purchaseAiPackage = createAsyncThunk(
  "ai/purchase",
  async (packageId) => {
    return {
      success: true,
      packageId,
      expiresAt: "2024-12-31",
    };
  }
);

// ====================== SLICE ==========================
const aiPackageSlice = createSlice({
  name: "aiPackage",
  initialState: {
    showModal: false,
    selectedService: null,
  },
  reducers: {
    closeModal(state) {
      state.showModal = false;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(checkAIPermission.fulfilled, (state, action) => {
      const { hasPackage, serviceCode } = action.payload;

      if (!hasPackage) {
        state.showModal = true;
        state.selectedService = serviceCode;
      }
    });

    builder.addCase(purchaseAiPackage.fulfilled, (state, action) => {
      state.showModal = false;
    });
  },
});

export const { closeModal } = aiPackageSlice.actions;

export default aiPackageSlice.reducer;
