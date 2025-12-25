// src/services/kaiwaService.js
// ============================================
// Service gọi API Kaiwa Practice
// ============================================

import api from "../configs/axios";
import { KAIWA_ENDPOINTS } from "../configs/aiKaiwaConfig";

export const kaiwaService = {
  /**
   * Gửi dữ liệu luyện nói lên backend
   * @param {Object} payload - { targetText, audioData, level, language, audioFormat, ... }
   */
  async practiceKaiwa(payload) {
    const res = await api.post(KAIWA_ENDPOINTS.PRACTICE, payload);
    // Tuỳ backend trả {success, data, message} hay trả thẳng data
    if (res.data?.success === false) {
      throw new Error(res.data.message || "Luyện nói thất bại");
    }
    return res.data?.data || res.data;
  },
};
