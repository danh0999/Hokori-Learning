import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const hasRole = (user, r) =>
  user?.role === r || (Array.isArray(user?.roles) && user.roles.includes(r));

export default function ProtectedRoute({ allow = [] }) {
  const user = useSelector((s) => s.user);
  const token =
    user?.accessToken || user?.token || localStorage.getItem("token");

  // Chưa đăng nhập
  if (!token) return <Navigate to="/login" replace />;

  // Không truyền allow => chỉ cần đăng nhập
  if (!allow.length) return <Outlet />;

  // Có truyền allow => kiểm tra role (chuẩn hoá UPPERCASE)
  const ok = allow.some((r) => hasRole(user, r.toUpperCase()));
  return ok ? <Outlet /> : <Navigate to="/403" replace />;
}
