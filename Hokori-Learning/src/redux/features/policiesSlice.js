import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// ======================================================
//  MOCK DATA (tạm thời khi chưa có API backend)
// TODO: Replace this section with real API call later
// ======================================================
const mockPolicyData = {
  title: "Điều khoản & Chính sách sử dụng Hokori",
  version: "v1.0",
  effective_from: "01/11/2025",
  content: [
    {
      heading: "1. Giới thiệu",
      body: `Hokori là nền tảng học tiếng Nhật trực tuyến tích hợp AI, 
      hoạt động như một sàn thương mại điện tử bán khóa học số, 
      kết nối giữa giáo viên và học viên.`,
    },
    {
      heading: "2. Quy định chung",
      body: `Người dùng phải cung cấp thông tin chính xác. Hokori có quyền 
      cập nhật hoặc điều chỉnh điều khoản mà không cần báo trước.`,
    },
    {
      heading: "3. Quyền và nghĩa vụ của Học viên",
      body: `Học viên có thể học các khóa đã thanh toán, không sao chép hoặc 
      phát tán nội dung. Có thể yêu cầu hoàn tiền trong 7 ngày nếu khóa học 
      không trùng khớp mô tả.`,
    },
    {
      heading: "4. Quyền và nghĩa vụ của Giáo viên",
      body: `Giáo viên chịu trách nhiệm về nội dung và bản quyền. Doanh thu 
      chia theo tỷ lệ mặc định 70/30. Hokori có quyền tạm giữ khi có khiếu nại.`,
    },
    {
      heading: "5. Chính sách sử dụng dịch vụ AI",
      body: `Dữ liệu giọng nói và văn bản được mã hóa, không chia sẻ cho bên 
      thứ ba. Gói AI có thời hạn và giới hạn lượt dùng.`,
    },
    {
      heading: "6. Chính sách hoàn tiền",
      body: `Áp dụng với khóa học chưa học quá 20% hoặc gói AI chưa vượt 10 lượt. 
      Tiền hoàn sẽ về tài khoản gốc trong 3–10 ngày làm việc.`,
    },
 
  ],
};


//  MOCK ASYNC THUNK (giả lập API gọi để lấy chính sách)

export const fetchMockPolicy = createAsyncThunk(
  "policies/fetchMock",
  async () => {
    // Giả lập delay API
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockPolicyData;
  }
);


// SLICE KHỞI TẠO

const policiesSlice = createSlice({
  name: "policies",
  initialState: {
    currentPolicy: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMockPolicy.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMockPolicy.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPolicy = action.payload;
      })
      .addCase(fetchMockPolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default policiesSlice.reducer;
