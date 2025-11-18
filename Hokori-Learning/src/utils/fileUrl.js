// src/utils/fileUrl.js
import api from "../configs/axios.js"; // chỗ bạn tạo axios instance

export const API_BASE_URL =
  api.defaults.baseURL?.replace(/\/api\/?$/, "") ||
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
  "";

export const buildFileUrl = (filePath) => {
  if (!filePath) return null;
  // nếu BE đã trả full URL thì dùng luôn
  if (/^https?:\/\//i.test(filePath)) return filePath;
  // nếu BE trả path tương đối (courses/21/cover/xxx.jpg) thì prefix /files
  return `${API_BASE_URL}/files/${filePath}`.replace(/([^:]\/)\/+/g, "$1");
};
