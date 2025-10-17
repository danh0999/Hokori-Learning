// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA3EeNgHjreNb4u1C0rmB_no-mrpW2ZnK4",
  authDomain: "hokori-web.firebaseapp.com",
  projectId: "hokori-web",
  // Kiểm tra giá trị này trên Firebase Console:
  // Thường là "<project-id>.appspot.com". Nếu Console hiển thị firebasestorage.app thì giữ nguyên.
  storageBucket: "hokori-web.appspot.com",
  messagingSenderId: "598821362969",
  appId: "1:598821362969:web:c2d31648a02816bfc9f988",
};

const app = initializeApp(firebaseConfig);

// Auth + Google provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// (tùy chọn) bắt buộc chọn tài khoản mỗi lần
googleProvider.setCustomParameters({ prompt: "select_account" });

// Firebase Storage
export const storage = getStorage(app);

export default app;
