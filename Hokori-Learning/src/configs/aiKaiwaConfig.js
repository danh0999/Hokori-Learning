// src/config/aiKaiwaConfig.js
// ============================================
// Config & hằng số cho AI Kaiwa
// ============================================

export const KAIWA_ENDPOINTS = {
  PRACTICE: "/ai/kaiwa-practice",
  // nếu có thêm API random sentence thì sau này thêm vào đây
};

export const KAIWA_DEFAULTS = {
  LANGUAGE: "ja-JP",
  LEVEL: "N5",
  VOICE: "female",
  SPEED: "normal",
};

export const KAIWA_ERROR_MESSAGES = {
  AUDIO_REQUIRED: "Vui lòng ghi âm trước khi gửi.",
  TARGET_TEXT_REQUIRED: "Vui lòng nhập câu tiếng Nhật cần luyện.",
  PRACTICE_FAILED: "Không thể luyện nói. Vui lòng thử lại.",
};
