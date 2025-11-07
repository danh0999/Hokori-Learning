import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios"; //  axios có baseURL + JWT header sẵn (/api/)

// ======================================================
// CART ASYNC ACTIONS (BACKEND CONNECTED)


// 🛒 Lấy giỏ hàng hiện tại của user
export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, thunkAPI) => {
  try {
    // KHÔNG thêm /api vì baseURL đã có sẵn "/api/"
    const res = await api.get("/cart");
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data || err.message);
  }
});

//  Thêm khóa học vào giỏ
export const addToCart = createAsyncThunk("cart/addToCart", async (courseId, thunkAPI) => {
  try {
    const res = await api.post("/cart/items", { courseId, quantity: 1 });
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data || err.message);
  }
});

//  Xóa toàn bộ giỏ hàng
export const clearCart = createAsyncThunk("cart/clearCart", async (_, thunkAPI) => {
  try {
    const res = await api.delete("/cart/items");
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data || err.message);
  }
});

//  Xóa 1 item khỏi giỏ
export const removeCartItem = createAsyncThunk("cart/removeCartItem", async (itemId, thunkAPI) => {
  try {
    const res = await api.delete(`/cart/items/${itemId}`);
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data || err.message);
  }
});

// 🔄 Cập nhật số lượng hoặc trạng thái chọn
export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ itemId, quantity, selected }, thunkAPI) => {
    try {
      const res = await api.patch(`/cart/items/${itemId}`, { quantity, selected });
      return res.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);


//  SLICE DEFINITION


const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [], // danh sách khóa học trong giỏ
    selectedSubtotal: 0, // tổng tiền của các item được chọn
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.selectedSubtotal = action.payload.selectedSubtotal || 0;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add item
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.selectedSubtotal = action.payload.selectedSubtotal;
      })

      // Remove item
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.selectedSubtotal = action.payload.selectedSubtotal;
      })

      // Update item
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.selectedSubtotal = action.payload.selectedSubtotal;
      })

      // Clear cart
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.selectedSubtotal = 0;
      });
  },
});

export default cartSlice.reducer;
