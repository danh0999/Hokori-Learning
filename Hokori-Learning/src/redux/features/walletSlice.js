// src/redux/features/walletSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

/**
 * GET /api/wallet/me
 * Lấy thông tin ví của user hiện tại (teacher)
 */
export const fetchMyWallet = createAsyncThunk(
  "wallet/fetchMyWallet",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("wallet/me"); // baseURL đã là /api/
      // tuỳ BE có bọc "data" hay không
      const raw = res?.data?.data ?? res.data ?? {};
      return {
        userId: raw.userId,
        walletBalance: raw.walletBalance ?? 0, // cents
        lastPayoutDate: raw.lastPayoutDate || null,
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Fetch wallet failed" }
      );
    }
  }
);

/**
 * GET /api/wallet/me/transactions
 * Lịch sử giao dịch ví của chính user
 * page, size, sort: array ["createdAt,desc"]
 */
export const fetchMyWalletTransactions = createAsyncThunk(
  "wallet/fetchMyWalletTransactions",
  async (
    { page = 0, size = 20, sort = ["createdAt,desc"] } = {},
    { rejectWithValue }
  ) => {
    try {
      const res = await api.get("wallet/me/transactions", {
        params: { page, size, sort },
      });

      const raw = res?.data?.data ?? res.data ?? {};
      // chuẩn Page<WalletTransaction>
      return {
        page,
        size,
        sort,
        ...raw,
        content: raw.content || [],
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Fetch transactions failed" }
      );
    }
  }
);

const initialState = {
  info: null, // { userId, walletBalance, lastPayoutDate }
  status: "idle",
  error: null,

  transactionsPage: null, // page đối tượng
  txStatus: "idle",
  txError: null,
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    resetWalletState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // ====== fetchMyWallet ======
      .addCase(fetchMyWallet.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMyWallet.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.info = action.payload;
      })
      .addCase(fetchMyWallet.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error;
      })

      // ====== fetchMyWalletTransactions ======
      .addCase(fetchMyWalletTransactions.pending, (state) => {
        state.txStatus = "loading";
        state.txError = null;
      })
      .addCase(fetchMyWalletTransactions.fulfilled, (state, action) => {
        state.txStatus = "succeeded";
        state.transactionsPage = action.payload;
      })
      .addCase(fetchMyWalletTransactions.rejected, (state, action) => {
        state.txStatus = "failed";
        state.txError = action.payload || action.error;
      });
  },
});

export const { resetWalletState } = walletSlice.actions;

/** ===== SELECTORS ===== */
export const selectWalletInfo = (state) => state.wallet?.info;
export const selectWalletStatus = (state) => state.wallet?.status;
export const selectWalletError = (state) => state.wallet?.error;

export const selectWalletTransactionsPage = (state) =>
  state.wallet?.transactionsPage;
export const selectWalletTransactionsStatus = (state) => state.wallet?.txStatus;
export const selectWalletTransactionsError = (state) => state.wallet?.txError;

export default walletSlice.reducer;
