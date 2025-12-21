import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

/* ==================== GET LIST ==================== */
export const fetchAdminAiPackages = createAsyncThunk(
  "adminAiPackages/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/ai-packages");
      return res.data.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ==================== CREATE ==================== */
export const createAdminAiPackage = createAsyncThunk(
  "adminAiPackages/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/admin/ai-packages", payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ==================== UPDATE (INFO) ==================== */
export const updateAdminAiPackageInfo = createAsyncThunk(
  "adminAiPackages/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/admin/ai-packages/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ==================== TOGGLE STATUS (FIXED) ==================== */
/**
 * ✅ Swagger chỉ có PUT /api/admin/ai-packages/{id}
 * -> toggle status phải gọi PUT update.
 * 
 * Vì nhiều BE yêu cầu payload đầy đủ cho PUT,
 * thunk sẽ lấy pkg từ state rồi build payload chuẩn (không gửi purchaseCount/usageCount).
 */
export const toggleAdminAiPackageStatus = createAsyncThunk(
  "adminAiPackages/toggleStatus",
  async ({ id, isActive }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const list = state?.adminAiPackages?.list || [];
      const pkg = list.find((p) => Number(p.id) === Number(id));

      if (!pkg) {
        return rejectWithValue("Không tìm thấy gói AI trong state để đổi trạng thái.");
      }

      const payload = {
        name: pkg.name,
        description: pkg.description,
        durationDays: Number(pkg.durationDays),
        priceCents: Number(pkg.priceCents),
        currency: pkg.currency || "VND",
        totalRequests: Number(pkg.totalRequests),
        displayOrder: pkg.displayOrder ?? 1,
        isActive: Boolean(isActive),
      };

      const res = await api.put(`/admin/ai-packages/${id}`, payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ==================== DELETE ==================== */
export const deleteAdminAiPackage = createAsyncThunk(
  "adminAiPackages/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/ai-packages/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const adminAiPackageSlice = createSlice({
  name: "adminAiPackages",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* FETCH */
      .addCase(fetchAdminAiPackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminAiPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAdminAiPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* CREATE */
      .addCase(createAdminAiPackage.pending, (state) => {
        state.error = null;
      })
      .addCase(createAdminAiPackage.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(createAdminAiPackage.rejected, (state, action) => {
        state.error = action.payload;
      })

      /* UPDATE INFO */
      .addCase(updateAdminAiPackageInfo.pending, (state) => {
        state.error = null;
      })
      .addCase(updateAdminAiPackageInfo.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateAdminAiPackageInfo.rejected, (state, action) => {
        state.error = action.payload;
      })

      /* TOGGLE STATUS */
      .addCase(toggleAdminAiPackageStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleAdminAiPackageStatus.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(toggleAdminAiPackageStatus.rejected, (state, action) => {
        state.error = action.payload;
      })

      /* DELETE */
      .addCase(deleteAdminAiPackage.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteAdminAiPackage.fulfilled, (state, action) => {
        state.list = state.list.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteAdminAiPackage.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default adminAiPackageSlice.reducer;
