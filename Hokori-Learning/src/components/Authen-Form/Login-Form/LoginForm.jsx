import React, { useState } from "react";
import { LockOutlined, UserOutlined, GoogleOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Flex, Divider } from "antd";
import Title from "antd/es/typography/Title";
import styles from "./styles.module.scss";
import { useNavigate } from "react-router-dom";
import AuthLogo from "../Auth-Logo/AuthLogo";

// 🔑 Service đăng nhập Google (xem phần ghi chú bên dưới)
import {
  loginWithGoogle,
  mapFirebaseAuthError,
} from "../../../redux/features/auth";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { login } from "../../../redux/features/userSlice";
import api from "../../../configs/axios";
import { getAuth } from "firebase/auth";


const LoginForm = () => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registerBtn } = styles;

  const onFinish = async (values) => {
    try {
      const res = await api.post("/auth/login", values);
      const { user, roles, accessToken, refreshToken } = res.data.data;

      const payload = {
        ...user,
        roles,
        role: roles?.[0] || null,
        accessToken,
        refreshToken,
      };

      dispatch(login(payload));
      localStorage.setItem("token", accessToken);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      console.error("Response data:", err?.response?.data);
      toast.error(err.normalizedMessage || "Đăng nhập thất bại");
    }
  };

const handleGoogleLogin = async () => {
  try {
    setLoadingGoogle(true);

    // 1) Popup Google
    const profile = await loginWithGoogle();

    // 2) Lấy ID token từ Firebase (ép refresh)
    const fbUser = getAuth().currentUser;                  // [CHANGED]
    if (!fbUser) throw new Error("Không lấy được người dùng Firebase"); // [CHANGED]
    const firebaseToken = await fbUser.getIdToken(true);    // [CHANGED]

    // 3) Gọi BE: /auth/firebase (LOGIN) — KHÔNG kèm Bearer cũ      // [CHANGED]
    const res = await api.post(
      "/auth/firebase",
      { firebaseToken },
      { headers: { Authorization: undefined } }             // [CHANGED]
    );

    // 4) Lấy dữ liệu chuẩn từ BE                                     // [CHANGED]
    const { user, roles, accessToken, refreshToken } = res.data.data || {};
    const safeRoles =
      Array.isArray(roles) && roles.length
        ? roles
        : user?.role?.roleName
        ? [user.role.roleName]
        : [];

    // 5) Lưu Redux + token                                            // [CHANGED]
    const payload = {
      ...user,
      roles: safeRoles,
      role: safeRoles?.[0] || null, // để các chỗ cũ còn dùng được
      accessToken,
      refreshToken,
    };
    dispatch(login(payload));
    if (accessToken) localStorage.setItem("token", accessToken);

    // 6) Điều hướng theo role mới nhất                                // [CHANGED]
    const isTeacher = safeRoles.map((r) => (r || "").toUpperCase()).includes("TEACHER");
    toast.success(`Xin chào, ${user?.displayName || user?.email || profile?.displayName || profile?.email}!`);
    navigate(isTeacher ? "/teacher" : "/");
  } catch (e) {
    console.error("Google login error:", e);
    toast.error(
      e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Đăng nhập bằng Google thất bại!"
    );
  } finally {
    setLoadingGoogle(false);
  }
};


  return (
    <div className={styles.loginFormContainer}>
      <AuthLogo />
      <Title level={2}>Đăng nhập</Title>

      {/* Nút Google */}
      <Button
        block
        size="large"
        icon={<GoogleOutlined />}
        loading={loadingGoogle}
        onClick={handleGoogleLogin}
      >
        Tiếp tục với Google
      </Button>

      <Divider plain>hoặc</Divider>

      <Form name="login" initialValues={{ remember: true }} onFinish={onFinish}>
        <Form.Item
          name="username"
          rules={[{ required: true, message: "Please input your Username!" }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Username" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: "Please input your Password!" }]}
        >
          <Input
            prefix={<LockOutlined />}
            type="password"
            placeholder="Password"
          />
        </Form.Item>

        <Form.Item>
          <Flex justify="space-between" align="center">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <a href="">Forgot password</a>
          </Flex>
        </Form.Item>

        <Form.Item>
          <Button block type="primary" htmlType="submit">
            Log in
          </Button>
          <div className={styles.extraLinks}>
            or{" "}
            <a
              href="/register"
              className={registerBtn}
              onClick={(e) => {
                e.preventDefault();
                navigate("/register");
              }}
            >
              Đăng ký ngay!
            </a>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LoginForm;
