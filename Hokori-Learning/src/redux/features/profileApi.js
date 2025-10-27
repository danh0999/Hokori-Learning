import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getCurrentProfile = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_URL}/api/profile/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateProfile = async (payload) => {
  const token = localStorage.getItem("token");
  const res = await axios.put(`${API_URL}/api/profile/me`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const changePassword = async (payload) => {
  const token = localStorage.getItem("token");
  const res = await axios.put(`${API_URL}/api/profile/me/password`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
