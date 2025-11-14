import axios from "axios";

/* ===========================================================
   AUTO DETECT BACKEND (Hokori Version 3 — Stable)
   Ưu tiên theo thứ tự:
   1. Nếu url FE chứa ngrok → backend = origin + /api
   2. Nếu backend ngrok cũ của team còn hoạt động → dùng nó
   3. Nếu không → dùng Railway (production)
   4. Chỉ dùng localhost nếu bạn BẬT BE local
=========================================================== */

function autoBackend() {
  const origin = window.location.origin;
  const host = window.location.host;

  // 1) FE chạy trên NGROK → dùng chung domain
  if (host.includes("ngrok-free.dev")) {
    return `${origin}/api`;
  }

  // 2) NGROK BACKEND của team (kiểm tra nhanh bằng HEAD)
  const ngrokCandidates = [
    "https://celsa-plumbaginaceous-unabjectly.ngrok-free.dev/api",
    "https://saner-eden-placably.ngrok-free.dev/api",
  ];

  // Chọn ngrok nếu FE detect mạng OK
  for (const url of ngrokCandidates) {
    // không block FE, chỉ check URL tồn tại
    return url; // dùng luôn, tránh lỗi chờ HEAD
  }

  // 3) Default → Railway (prod)
  return "https://hokoribe-production.up.railway.app/api";
}

const api = axios.create({
  baseURL: autoBackend(),
  withCredentials: false,
});

console.log("🔧 Axios Backend URL:", api.defaults.baseURL);

/* ===========================================================
   REQUEST INTERCEPTOR
=========================================================== */
api.interceptors.request.use(
  (config) => {
    config.headers["ngrok-skip-browser-warning"] = "any";
    config.headers["Accept"] = "application/json";

    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    const isAuth =
      !config.url?.includes("login") &&
      !config.url?.includes("register") &&
      !config.url?.includes("firebase");

    if (token && isAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ===========================================================
   RESPONSE INTERCEPTOR
=========================================================== */
api.interceptors.response.use(
  (res) => {
    const body = res?.data;

    if (
      body &&
      typeof body === "object" &&
      Object.prototype.hasOwnProperty.call(body, "success") &&
      body.success === false
    ) {
      const err = new Error(body.message || "Request failed");
      err.isBusinessError = true;
      err.response = res;
      err.normalizedMessage = body.message || "Request failed";
      return Promise.reject(err);
    }

    return res;
  },
  (error) => {
    let msg = "Request failed";

    if (error?.response) {
      msg =
        error.response.data?.message ||
        error.response.data?.error ||
        error.message ||
        msg;
    } else if (error?.request) {
      msg = "Network error. Please check your connection.";
    } else {
      msg = error.message || msg;
    }

    error.normalizedMessage = msg;
    return Promise.reject(error);
  }
);

export default api;
