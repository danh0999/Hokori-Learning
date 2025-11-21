import axios from "axios";

/* -----------------------------
  BACKEND URLS (CHỌN 1 CÁI)
----------------------------- */

// Production (Railway)
const RAILWAY = "https://hokoribe-production.up.railway.app/api";

// Local dev
const LOCAL = "http://localhost:8080/api";

// FE-ngrok (khi FE chạy qua ngrok, backend map về /api trên cùng origin)
// Ví dụ: https://xxx.ngrok-free.app/api
const NGROK_FE = `${window.location.origin}/api`;

// 👉 Chọn 1 trong các dòng dưới, bỏ comment để dùng:

// const BASE_URL = RAILWAY;
// const BASE_URL = LOCAL;
const BASE_URL = RAILWAY; // muốn dùng link nào thì ghi tên biến đó vào
// const BASE_URL = NGROK_FE;

/* -----------------------------
   INIT AXIOS
----------------------------- */

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

/* -----------------------------
   REQUEST INTERCEPTOR
----------------------------- */
api.interceptors.request.use(
  (config) => {
    // header cho ngrok
    config.headers["ngrok-skip-browser-warning"] = "any";
    config.headers.Accept = "application/json";

    // Lấy token từ localStorage hoặc sessionStorage
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    // Những URL không cần token (login / register / firebase)
    const isAuth =
      !config.url.includes("login") &&
      !config.url.includes("register") &&
      !config.url.includes("firebase");

    if (token && isAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (err) => Promise.reject(err)
);

/* -----------------------------
   RESPONSE INTERCEPTOR
----------------------------- */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    let msg = "Request failed";

    if (error.response) {
      msg =
        error.response.data?.message ||
        error.response.data?.error ||
        error.message;
    } else if (error.request) {
      msg = "Network error";
    }

    error.normalizedMessage = msg;
    return Promise.reject(error);
  }
);

export default api;
