// src/utils/audioUtils.js
// ============================================
// Audio utilities cho Kaiwa Practice
// ============================================

/**
 * Chuyển Blob audio (WebM, OGG, ...) sang base64 string (không include prefix)
 */
export const convertBlobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    if (!blob) {
      reject(new Error("Audio blob is empty"));
      return;
  }

    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const result = reader.result || "";
        const base64String = result.toString().split(",")[1] || "";
        resolve(base64String);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read audio blob"));

    reader.readAsDataURL(blob);
  });

/**
 * Xác định audioFormat gửi lên backend dựa vào MIME type
 * Backend sẽ dùng giá trị này để validate và xử lý
 */
export const getAudioFormat = (blob) => {
  const type = blob?.type || "";

  if (type.includes("webm")) return "webm";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  if (type.includes("wav")) return "wav";
  if (type.includes("flac")) return "flac";

  // Mặc định (BE vẫn xử lý được nếu convert nội bộ)
  return "webm";
};
