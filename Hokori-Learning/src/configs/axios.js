import axios from "axios";

/* ===========================================================

=========================================================== */

/* -----------------------------
   BACKEND CANDIDATES
----------------------------- */
const PRIMARY = "https://hokoribe-production.up.railway.app/api"; // PROD

// FE đang chạy ngrok → backend = FE_origin/api
const NGROK_FE_FALLBACK = () => `${window.location.origin}/api`;

// Tất cả backend ngrok nội bộ (Phú, Khoa,...)
const NGROK_BACKENDS = [
  "https://saner-eden-placably.ngrok-free.dev/api",        // Backend 1
  "https://celsa-plumbaginaceous-unabjectly.ngrok-free.dev/api" // Backend 2 (CELSA)
];

const LOCAL = "http://localhost:8080/api";

/* -----------------------------
   CACHE KEY
----------------------------- */
const CACHE_KEY = "hokori_backend_url";
const CACHE_EXP_KEY = "hokori_backend_exp";

/* ===========================================================
    1. HEARTBEAT CHECK (FAST)
=========================================================== */
async function isAlive(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 250);

    await fetch(url + "/health", { signal: controller.signal });

    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

/* ===========================================================
    2. SMART CACHE (24 HOURS)
=========================================================== */
function getCachedBackend() {
  const saved = localStorage.getItem(CACHE_KEY);
  const exp = localStorage.getItem(CACHE_EXP_KEY);

  if (!saved || !exp) return null;

  if (Date.now() > Number(exp)) {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXP_KEY);
    return null;
  }
  return saved;
}

function saveBackend(url) {
  localStorage.setItem(CACHE_KEY, url);
  localStorage.setItem(CACHE_EXP_KEY, Date.now() + 24 * 60 * 60 * 1000);
}

/* ===========================================================
    3. MAIN AUTO DETECTOR
=========================================================== */
async function autoBackend() {
  // 1) Dùng cached nếu còn hạn
  const cached = getCachedBackend();
  if (cached) {
    console.log(" Using cached backend:", cached);
    return cached;
  }

  /* -----------------------------
      PRIORITY BACKEND LIST
  ----------------------------- */
  const candidates = [PRIMARY];

  // 2) FE đang chạy trên ngrok
  if (window.location.host.includes("ngrok")) {
    candidates.push(NGROK_FE_FALLBACK());
  }

  // 3) Tất cả backend ngrok nội bộ
  candidates.push(...NGROK_BACKENDS);

  // 4) Cuối cùng: Localhost
  candidates.push(LOCAL);

  console.log(" Checking backends:", candidates);

  // HEARTBEAT CHECK
  for (const url of candidates) {
    const alive = await isAlive(url);
    if (alive) {
      console.log(" Backend selected:", url);
      saveBackend(url);
      return url;
    }
  }

  // fallback cứng
  console.warn(" All backends failed — fallback to Railway");
  saveBackend(PRIMARY);
  return PRIMARY;
}

/* ===========================================================
    4. INIT AXIOS (temporary baseURL)
=========================================================== */
const api = axios.create({
  baseURL: PRIMARY,
  withCredentials: false,
});

// Update baseURL async
autoBackend().then((realURL) => {
  api.defaults.baseURL = realURL;
  console.log(" Axios backend active:", realURL);
});

/* ===========================================================
    5. REQUEST INTERCEPTOR
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
    6. RESPONSE INTERCEPTOR
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
