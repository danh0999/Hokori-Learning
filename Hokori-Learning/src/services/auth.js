// src/services/auth.js
import {
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export async function loginWithGoogle() {
  await setPersistence(auth, browserLocalPersistence);
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  // const idToken = await user.getIdToken(); // gửi BE nếu cần xác thực server-side
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export async function logoutFirebase() {
  await signOut(auth);
}
/**
 * Lắng nghe trạng thái user Firebase (nếu muốn đồng bộ toàn app)
 * @param {(user|null)=>void} callback
 * @returns {()=>void} unsub
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Mapping lỗi Firebase (để hiển thị message thân thiện)
 */
export function mapFirebaseAuthError(error) {
  const code = error?.code || "";
  if (code.includes("auth/popup-closed-by-user"))
    return "Bạn đã đóng cửa sổ đăng nhập.";
  if (code.includes("auth/cancelled-popup-request"))
    return "Đang có một popup đăng nhập khác.";
  if (code.includes("auth/popup-blocked"))
    return "Trình duyệt chặn popup. Hãy cho phép popup rồi thử lại.";
  if (code.includes("auth/configuration-not-found"))
    return "Cấu hình Auth chưa đúng (chưa bật Google hoặc thiếu Authorized domain).";
  if (code.includes("auth/operation-not-allowed"))
    return "Phương thức đăng nhập chưa được bật trong Firebase.";
  return "Đăng nhập thất bại. Vui lòng thử lại.";
}
