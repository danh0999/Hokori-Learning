import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ allow = [] }) {
  const storeUser = useSelector((s) => s.user);

  // ✅ CHỈ tin token trong storage
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  // ❌ Không có token = chưa login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Lấy role từ redux (chỉ để UI / phân quyền)
  const rolesUpper = storeUser?.roles?.map((r) => r.toUpperCase()) ?? [];

  // Không yêu cầu role cụ thể
  if (!allow.length) return <Outlet />;

  const allowUpper = allow.map((r) => r.toUpperCase());
  const ok = rolesUpper.some((r) => allowUpper.includes(r));

  return ok ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}
