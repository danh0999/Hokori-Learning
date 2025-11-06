import axios from "axios";

const api = axios.create({
  //key ĐA
  baseURL: "https://saner-eden-placably.ngrok-free.dev/api/",
  // timeout: 15000, // (tuỳ) tránh treo request quá lâu

  //Key phú
  // baseURL: "https://celsa-plumbaginaceous-unabjectly.ngrok-free.dev/api/",
  //key Khoa
});

// === Request interceptor: gắn Bearer token (trừ login/register) ===
api.interceptors.request.use(
  (config) => {
    config.headers["ngrok-skip-browser-warning"] = "any";
    config.headers["Accept"] = "application/json";
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (
      token &&
      !config.url?.includes("login") &&
      !config.url?.includes("register") &&
      !config.url?.includes("firebase")
    ) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// === Response interceptor: tự reject khi success=false & chuẩn hoá lỗi ===
api.interceptors.response.use(
  (response) => {
    // Một số API trả 200 nhưng success=false -> coi như lỗi nghiệp vụ
    const body = response?.data;
    if (
      body &&
      typeof body === "object" &&
      Object.prototype.hasOwnProperty.call(body, "success") &&
      body.success === false
    ) {
      const err = new Error(body.message || "Request failed");
      err.isBusinessError = true;
      // giữ nguyên response để devtools vẫn xem được Network tab
      err.response = response;
      // tiện cho UI: message đã chuẩn hoá
      err.normalizedMessage = body.message || "Request failed";
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    // Chuẩn hoá message cho tất cả trường hợp
    let msg = "Request failed";
    if (error?.response) {
      // Server trả về non-2xx
      msg =
        error.response.data?.message ||
        error.response.data?.error ||
        error.message ||
        msg;
    } else if (error?.request) {
      // Request gửi đi nhưng không nhận response
      msg = "Network error. Please check your connection.";
    } else {
      // Lỗi khi setup request
      msg = error.message || msg;
    }
    error.normalizedMessage = msg;
    return Promise.reject(error);
  }
);

export default api;
