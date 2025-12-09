// src/redux/features/policiesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

/* ===========================================================
   1) GET LIST POLICIES BY ROLE (Public)
=========================================================== */
export const fetchPoliciesByRole = createAsyncThunk(
  "policies/fetchByRole",
  async (roleName, { rejectWithValue }) => {
    try {
      const res = await api.get(`/public/policies/role/${roleName}`);
      return res.data.data; // list
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ===========================================================
   2) GET POLICY BY ID (Public)
=========================================================== */
export const fetchPolicyById = createAsyncThunk(
  "policies/fetchById",
  async (policyId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/public/policies/${policyId}`);
      return res.data.data; // object
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ===========================================================
   SLICE
=========================================================== */
const policiesSlice = createSlice({
  name: "policies",
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelected: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* LIST */
      .addCase(fetchPoliciesByRole.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPoliciesByRole.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPoliciesByRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* DETAIL */
      .addCase(fetchPolicyById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPolicyById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchPolicyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelected } = policiesSlice.actions;
export default policiesSlice.reducer;
