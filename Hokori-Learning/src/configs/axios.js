import axios from "axios";

/* ===========================================================
   BACKEND BASE URL — CHỌN TỰ ĐỘNG / HOẶC GẮN CỐ ĐỊNH
=========================================================== */

// Railway (production)
const PROD = "https://api.hokori-backend.org/api";

// Local dev
const LOCAL = "http://localhost:8080/api";

// FE Ngrok (nếu FE chạy qua ngrok → backend = FE_origin/api)
const FE_NGROK = `${window.location.origin}/api`;

// ---- CHỌN MÔI TRƯỜNG Ở ĐÂY ----
const BASE_URL = PROD;
// const BASE_URL = LOCAL;
// const BASE_URL = FE_NGROK;

/* ===========================================================
   INIT AXIOS INSTANCE
=========================================================== */
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

/* ===========================================================
   REQUEST INTERCEPTOR
=========================================================== */
api.interceptors.request.use(
  (config) => {
    // Bypass ngrok warning
    config.headers["ngrok-skip-browser-warning"] = "true";
    config.headers["Accept"] = "application/json";
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    /* -----------------------------------------
       LẤY TOKEN CHUẨN HOÁ
    ------------------------------------------- */
    const accessToken =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    // URL không cần token
    const noAuthNeeded =
      config.url.includes("login") ||
      config.url.includes("register") ||
      config.url.includes("firebase");

    if (!noAuthNeeded && accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return config;
  },
  (err) => Promise.reject(err)
);

/* ===========================================================
   RESPONSE INTERCEPTOR
=========================================================== */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    let msg = "Request failed";

    if (error.response) {
      msg =
        error.response.data?.message ||
        error.response.data?.error ||
        error.message;
    } else {
      msg = "Network error";
    }

    error.normalizedMessage = msg;
    return Promise.reject(error);
  }
);

export default api;
