import React from "react";
import AuthenTemplate from "../../../components/Authen-Template/authen-template";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function Login() {
  const user = useSelector((state) => state.user); // ✅ dùng đúng selector

  if (user) {
    switch (user.role) {
      case "ADMIN":
        return <Navigate to="/admin" replace />;
      case "LEARNER":
        return <Navigate to="/" replace />;
      case "MODERATOR":
        return <Navigate to="/moderator" replace />;
      case "TEACHER":
        return <Navigate to="/teacher" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <AuthenTemplate isLogin={true} />;
}

export default Login;
