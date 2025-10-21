import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Home from "../pages/Home/Home";

const hasRole = (user, role) =>
  user?.role === role ||
  (Array.isArray(user?.roles) && user.roles.includes(role));

export default function RoleBasedRedirect() {
  const user = useSelector((s) => s.user);
  const token =
    user?.accessToken || user?.token || localStorage.getItem("token");

  if (!token) return <Home />;

  if (hasRole(user, "ADMIN")) return <Navigate to="/admin" replace />;
  if (hasRole(user, "MODERATOR")) return <Navigate to="/moderator" replace />;
  if (hasRole(user, "TEACHER")) return <Navigate to="/teacher" replace />;
  if (hasRole(user, "LEARNER")) return <Navigate to="/learner" replace />; // hoặc "/"
  return <Home />;
}
