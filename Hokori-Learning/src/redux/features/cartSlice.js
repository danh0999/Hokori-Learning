import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
// import api from "../services/axios"; // 🔜 Un-comment when backend API ready

const initialState = {
  items: [],
  status: "idle",
  error: null,
};

/* ======================================================
    CART SLICE DEMO VERSION (API commented out)
   Khi backend sẵn sàng chỉ cần gỡ comment các dòng api.*
   ====================================================== */

// ======= Thunk (API thật - Tạm tắt) =======
/*
export const fetchCart = createAsyncThunk("cart/fetch", async (_, thunkAPI) => {
  try {
    const res = await api.get("/api/cart");
    return res.data;
  } catch (err) {
    toast.error("Không thể tải giỏ hàng!");
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const addToCart = createAsyncThunk("cart/add", async (course, thunkAPI) => {
  try {
    await api.post("/api/cart/add", { product_id: course.id });
    toast.success(`Đã thêm "${course.title}" vào giỏ hàng!`);
    return course;
  } catch (err) {
    toast.error("Không thể thêm vào giỏ hàng!");
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const removeFromCart = createAsyncThunk("cart/remove", async (id, thunkAPI) => {
  try {
    await api.delete(`/api/cart/${id}`);
    toast.info("Đã xóa khóa học khỏi giỏ hàng!");
    return id;
  } catch (err) {
    toast.error("Không thể xóa khóa học!");
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const clearCart = createAsyncThunk("cart/clear", async (_, thunkAPI) => {
  try {
    await api.delete("/api/cart/clear");
    toast.info("Đã xóa toàn bộ giỏ hàng!");
    return [];
  } catch (err) {
    toast.error("Không thể xóa giỏ hàng!");
    return thunkAPI.rejectWithValue(err.message);
  }
});
*/

// ========== DEMO LOGIC (client-only) ==========
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    //  Thêm vào giỏ hàng
    addItem: (state, action) => {
      const course = action.payload;
      const exists = state.items.some((c) => c.id === course.id);

      if (exists) {
        toast.warn(`Khóa học "${course.title}" đã có trong giỏ hàng!`, {
          icon: "🛒",
          style: { backgroundColor: "#fff", color: "#111" },
          autoClose: 1500,
        });
        return;
      }

      // 🔹 Demo: thêm trực tiếp vào Redux
      state.items.push(course);

      toast.success(`Đã thêm "${course.title}" vào giỏ hàng!`, {
        icon: "🛍️",
        style: { backgroundColor: "#fff", color: "#111" },
        autoClose: 1500,
      });

      // 🔜 Un-comment when backend API ready
      // await api.post("/api/cart/add", { product_id: course.id });
    },

    //  Xóa khỏi giỏ hàng
    removeItem: (state, action) => {
      const id = action.payload;
      const course = state.items.find((c) => c.id === id);
      state.items = state.items.filter((c) => c.id !== id);

      if (course) {
        toast.info(`Đã xóa "${course.title}" khỏi giỏ hàng.`, {
          icon: "🗑️",
          style: { backgroundColor: "#fff", color: "#111" },
          autoClose: 1200,
        });
      }

      // 🔜 Un-comment when backend API ready
      // await api.delete(`/api/cart/${id}`);
    },

    //  Xóa toàn bộ
    clearCart: (state) => {
      if (!state.items.length) return;
      state.items = [];

      toast.info("Đã xóa toàn bộ giỏ hàng!", {
        icon: "🧺",
        style: { backgroundColor: "#fff", color: "#111" },
        autoClose: 1500,
      });

      //  Un-comment when backend API ready
      // await api.delete("/api/cart/clear");
    },
  },
  extraReducers: (builder) => {
    //  Khi có API thật, chỉ cần gỡ comment các case dưới
    /*
    builder
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload);
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
      });
    */
  },
});

export const { addItem, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
