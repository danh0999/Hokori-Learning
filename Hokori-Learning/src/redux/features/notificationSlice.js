import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios.js"; // axios instance của bạn

// Lấy tất cả notifications
export const fetchNotificationsThunk = createAsyncThunk(
  "notifications/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/notifications"); // GET /api/notifications
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Lấy số lượng chưa đọc
export const fetchUnreadCountThunk = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/notifications/unread/count"); // GET /api/notifications/unread/count
      return res.data; // trả về số (int)
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Đánh dấu 1 notification là đã đọc
export const markNotificationReadThunk = createAsyncThunk(
  "notifications/markRead",
  async (id, { rejectWithValue }) => {
    try {
      await api.patch(`/notifications/${id}/read`); // PATCH /api/notifications/{id}/read
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Đánh dấu tất cả là đã đọc
export const markAllNotificationsReadThunk = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await api.patch("/notifications/read-all"); // PATCH /api/notifications/read-all
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotificationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch notifications";
      })

      // fetchUnreadCount
      .addCase(fetchUnreadCountThunk.fulfilled, (state, action) => {
        state.unreadCount = action.payload ?? 0;
      })

      // markNotificationRead
      .addCase(markNotificationReadThunk.fulfilled, (state, action) => {
        const id = action.payload;
        const noti = state.items.find((n) => n.id === id);
        if (noti) {
          noti.isRead = true;
        }
        if (state.unreadCount > 0) state.unreadCount -= 1;
      })

      // markAllNotificationsRead
      .addCase(markAllNotificationsReadThunk.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, isRead: true }));
        state.unreadCount = 0;
      });
  },
});

export default notificationSlice.reducer;
