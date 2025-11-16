// ============================================
// Convert Blob (WebM audio) -> Base64 string
// Dùng cho Kaiwa Practice API
// Backend tự xử lý webm -> wav
// ============================================

export const convertBlobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.onloadend = () => {
        // reader.result = "data:audio/webm;base64,AAA...."
        const base64String = reader.result.split(",")[1]; // Lấy phần base64
        resolve(base64String);
      };

      reader.onerror = () => {
        reject("Không thể chuyển đổi audio Blob sang base64");
      };

      reader.readAsDataURL(blob); // Đọc blob -> base64
    } catch (error) {
      reject(error);
    }
  });
