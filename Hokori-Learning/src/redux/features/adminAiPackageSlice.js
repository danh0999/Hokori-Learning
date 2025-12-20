import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// ==================== GET LIST (ALL) ====================
export const fetchAdminAiPackages = createAsyncThunk(
  "adminAiPackages/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/ai-packages");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


// ==================== GET BY ID ====================
export const fetchAdminAiPackageById = createAsyncThunk(
  "adminAiPackages/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/admin/ai-packages/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ==================== CREATE ====================
export const createAdminAiPackage = createAsyncThunk(
  "adminAiPackages/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/admin/ai-packages", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ==================== UPDATE ====================
export const updateAdminAiPackage = createAsyncThunk(
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

// ==================== DELETE ====================
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

// ==================== SLICE ====================
const adminAiPackageSlice = createSlice({
  name: "adminAiPackages",
  initialState: {
    list: [],
    loading: false,
    error: null,
    detail: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Get list
    builder
      .addCase(fetchAdminAiPackages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminAiPackages.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAdminAiPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create
    builder.addCase(createAdminAiPackage.fulfilled, (state, action) => {
      state.list.unshift(action.payload);
    });

    // Update
    builder.addCase(updateAdminAiPackage.fulfilled, (state, action) => {
      state.list = state.list.map((p) =>
        p.id === action.payload.id ? action.payload : p
      );
    });

    // Delete
    builder.addCase(deleteAdminAiPackage.fulfilled, (state, action) => {
      state.list = state.list.filter((p) => p.id !== action.payload);
    });
  },
});

export default adminAiPackageSlice.reducer;
