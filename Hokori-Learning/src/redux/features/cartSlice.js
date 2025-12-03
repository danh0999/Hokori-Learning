// ======= Thunk (API thật ) =======
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import api from "../../configs/axios";

const initialState = {
  items: [],
  status: "idle",
  error: null,
};

/* ======================================================
    CART SLICE – DÙNG API THẬT
   ====================================================== */

// Lấy giỏ hàng hiện tại
export const fetchCart = createAsyncThunk("cart/fetch", async (_, thunkAPI) => {
  try {
    const res = await api.get("cart");
    return res.data;
  } catch (err) {
    // ❗ KHÔNG SHOW TOAST NỮA KHI LỖI 403
    if (err.response?.status !== 403) {
      toast.error("Không thể tải giỏ hàng!");
    }
    return thunkAPI.rejectWithValue(err.response?.data || err.message);
  }
});

// Thêm khóa học vào giỏ
export const addToCart = createAsyncThunk(
  "cart/add",
  async (course, thunkAPI) => {
    try {
      await api.post("cart/items", {
        courseId: course.id,
      });

      const res = await api.get("cart");

      toast.success(`Đã thêm "${course.title}" vào giỏ hàng!`, {
        autoClose: 1500,
      });

      return res.data;
    } catch (err) {
      toast.error("Không thể thêm vào giỏ hàng!");
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Cập nhật item
export const updateCartItem = createAsyncThunk(
  "cart/updateItem",
  async ({ itemId, quantity, selected }, thunkAPI) => {
    try {
      const body = {};
      if (quantity !== undefined) body.quantity = quantity;
      if (selected !== undefined) body.selected = selected;

      await api.patch(`cart/items/${itemId}`, body);

      const res = await api.get("cart");

      toast.success("Cập nhật giỏ hàng thành công!", {
        autoClose: 1000,
      });

      return res.data;
    } catch (err) {
      toast.error("Không thể cập nhật giỏ hàng!");
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Chọn / Bỏ chọn tất cả
export const selectAllCartItems = createAsyncThunk(
  "cart/selectAll",
  async (selected, thunkAPI) => {
    try {
      await api.patch(`cart/items/select-all?selected=${selected}`);
      const res = await api.get("cart");

      toast.info(selected ? "Đã chọn tất cả khóa học" : "Đã bỏ chọn tất cả!", {
        autoClose: 1200,
      });

      return res.data;
    } catch (err) {
      toast.error("Không thể thay đổi trạng thái chọn!");
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Xóa 1 item
export const removeFromCart = createAsyncThunk(
  "cart/remove",
  async (itemId, thunkAPI) => {
    try {
      await api.delete(`cart/items/${itemId}`);

      const res = await api.get("cart");

      toast.info("Đã xóa khóa học khỏi giỏ hàng!", {
        autoClose: 1200,
      });

      return res.data;
    } catch (err) {
      toast.error("Không thể xóa khóa học!");
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Xóa toàn bộ giỏ
export const clearCartOnServer = createAsyncThunk(
  "cart/clear",
  async (_, thunkAPI) => {
    try {
      await api.delete("cart/items");

      const res = await api.get("cart");

      toast.info("Đã xóa toàn bộ giỏ hàng!", {
        autoClose: 1500,
      });

      return res.data;
    } catch (err) {
      toast.error("Không thể xóa giỏ hàng!");
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Local demo actions
    addItem: (state, action) => {
      const course = action.payload;
      const exists = state.items.some((c) => c.id === course.id);

      if (exists) {
        toast.warn(`Khóa học "${course.title}" đã có trong giỏ hàng!`, {
          autoClose: 1500,
        });
        return;
      }

      state.items.push(course);
    },

    removeItem: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((c) => c.id !== id);
    },

    clearCart: (state) => {
      state.items = [];
    },
  },

  extraReducers: (builder) => {
    const setItemsFromPayload = (state, action) => {
      state.status = "succeeded";

      const res = action.payload;

      if (!res || !res.data) {
        state.items = [];
        return;
      }

      const items = res.data.items;

      if (Array.isArray(items)) {
        state.items = items;
      } else {
        state.items = [];
      }
    };

    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, setItemsFromPayload)
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      .addCase(addToCart.fulfilled, setItemsFromPayload)
      .addCase(removeFromCart.fulfilled, setItemsFromPayload)
      .addCase(clearCartOnServer.fulfilled, setItemsFromPayload)
      .addCase(updateCartItem.fulfilled, setItemsFromPayload)
      .addCase(selectAllCartItems.fulfilled, setItemsFromPayload);
  },
});

export const { addItem, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
