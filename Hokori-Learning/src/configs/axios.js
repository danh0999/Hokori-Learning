import axios from "axios";

const api = axios.create({
  baseURL: "https://0b07518fb45b.ngrok-free.app/",
});

api.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (
      token &&
      !config.url.includes("login") &&
      !config.url.includes("register")
    ) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

export default api;
