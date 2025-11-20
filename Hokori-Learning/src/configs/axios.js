import axios from "axios";

/* -----------------------------
  BACKEND URLS
----------------------------- */

// 1) Production
const RAILWAY = "https://hokoribe-production.up.railway.app/api";

// 2) FE-ngrok (khi FE ở domain ngrok → dùng origin/api)
const NGROK_FE_FALLBACK = () => `${window.location.origin}/api`;

// 3–4) Backend DEV nội bộ
const DEV_BACKENDS = [
  {
    url: "https://celsa-plumbaginaceous-unabjectly.ngrok-free.dev/api",
    priority: 3,
  },
  {
    url: "https://saner-eden-placably.ngrok-free.dev/api",
    priority: 4,
  },
];

// 5) Localhost
const LOCAL = "http://localhost:8080/api";

/* -----------------------------
   CACHE
----------------------------- */
const CACHE_KEY = "hokori_backend_url";
const CACHE_EXP_KEY = "hokori_backend_exp";

function getCached() {
  const url = localStorage.getItem(CACHE_KEY);
  const exp = localStorage.getItem(CACHE_EXP_KEY);

  if (!url || !exp) return null;

  if (Date.now() > Number(exp)) {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXP_KEY);
    return null;
  }
  return url;
}

function setCached(url) {
  localStorage.setItem(CACHE_KEY, url);
  localStorage.setItem(CACHE_EXP_KEY, Date.now() + 24 * 60 * 60 * 1000);
}

/* -----------------------------
   HEARTBEAT CHECK
----------------------------- */
async function fastPing(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 200);

    await fetch(url + "/health", { signal: controller.signal });

    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

/* -----------------------------
   AUTO-DETECTOR (PARALLEL RACE)
----------------------------- */
async function autoBackend() {
  // 1) use cached if available
  const cached = getCached();
  if (cached) return cached;

  const candidates = [];

  // FE-ngrok chạy → ưu tiên sau railway
  if (window.location.host.includes("ngrok")) {
    candidates.push({ url: NGROK_FE_FALLBACK(), priority: 2 });
  }

  // priority order:
  candidates.push({ url: RAILWAY, priority: 1 });
  candidates.push(...DEV_BACKENDS);
  candidates.push({ url: LOCAL, priority: 10 }); // low priority

  // ping song song tất cả
  const results = await Promise.all(
    candidates.map(async (c) => ({
      ...c,
      alive: await fastPing(c.url),
    }))
  );

  const aliveList = results.filter((r) => r.alive);

  // nếu không backend nào sống → fallback Railway
  if (aliveList.length === 0) {
    setCached(RAILWAY);
    return RAILWAY;
  }

  // sort theo priority
  aliveList.sort((a, b) => a.priority - b.priority);

  const best = aliveList[0].url;
  setCached(best);

  return best;
}

/* -----------------------------
   INIT AXIOS
----------------------------- */
const api = axios.create({
  baseURL: RAILWAY, // tạm thời
  withCredentials: false,
});

// cập nhật baseURL sau khi detect
autoBackend().then((realURL) => {
  api.defaults.baseURL = realURL;
  console.log("🚀 Hokori Backend Active:", realURL);
});

/* -----------------------------
   REQUEST INTERCEPTOR
----------------------------- */
api.interceptors.request.use(
  (config) => {
    config.headers["ngrok-skip-browser-warning"] = "any";
    config.headers.Accept = "application/json";

    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

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
