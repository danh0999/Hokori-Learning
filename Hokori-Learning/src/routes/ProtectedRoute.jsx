import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

function normalizeUser(u) {
  const cur = u?.current ?? u ?? {};
  const roleFromObj = cur?.role?.roleName || cur?.roleName;
  const rolesArr =
    Array.isArray(cur?.roles) && cur.roles.length > 0
      ? cur.roles
      : roleFromObj
      ? [roleFromObj]
      : [];
  const rolesUpper = rolesArr.map((x) => (x || "").toUpperCase());
  const token = cur?.accessToken || cur?.token || localStorage.getItem("token");
  return { cur, rolesUpper, token };
}

export default function ProtectedRoute({ allow = [] }) {
  const location = useLocation();
  const storeUser = useSelector((s) => s.user);
  const { rolesUpper, token } = normalizeUser(storeUser);

  // Chưa đăng nhập -> về login, giữ lại URL cũ
  if (!token) {
    const redirectPath = encodeURIComponent(
      location.pathname + location.search
    );
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
  }

  // Không truyền allow => chỉ cần đăng nhập
  if (!allow?.length) return <Outlet />;

  // Có truyền allow => kiểm tra giao nhau (case-insensitive)
  const allowUpper = allow.map((x) => (x || "").toUpperCase());
  const ok = rolesUpper.some((r) => allowUpper.includes(r));

  // Không có trang /403 trong routes của bạn -> trả về trang chủ
  return ok ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}
