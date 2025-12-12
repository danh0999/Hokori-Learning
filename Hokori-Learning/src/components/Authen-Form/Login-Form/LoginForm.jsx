import React, { useMemo, useState } from "react";
import {
  LockOutlined,
  UserOutlined,
  GoogleOutlined,
  MailOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Flex,
  Divider,
  Modal,
  Steps,
} from "antd";
import Title from "antd/es/typography/Title";
import styles from "./styles.module.scss";
import { useNavigate } from "react-router-dom";
import AuthLogo from "../Auth-Logo/AuthLogo";

// 🔑 Service đăng nhập Google
import { loginWithGoogle } from "../../../redux/features/auth";
import { useDispatch } from "react-redux";
import { login } from "../../../redux/features/userSlice";
import api from "../../../configs/axios";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";

const OTP_LEN = 6;

const LoginForm = () => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(0); // 0 request-otp, 1 verify-otp, 2 reset
  const [forgotLoading, setForgotLoading] = useState(false);

  const [forgotEmailOrPhone, setForgotEmailOrPhone] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");

  const [forgotForm] = Form.useForm();
  const [verifyForm] = Form.useForm();
  const [resetForm] = Form.useForm();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registerBtn } = styles;

  const forgotSteps = useMemo(
    () => [
      { title: "Gửi OTP" },
      { title: "Xác thực OTP" },
      { title: "Đặt lại mật khẩu" },
    ],
    []
  );

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
      toast.success(`Xin chào, ${user.fullName || user.username}!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true);

      const profile = await loginWithGoogle();

      const fbUser = getAuth().currentUser;
      if (!fbUser) throw new Error("Không lấy được người dùng Firebase");
      const firebaseToken = await fbUser.getIdToken(true);

      const res = await api.post(
        "/auth/firebase",
        { firebaseToken },
        { headers: { Authorization: undefined } }
      );

      const { user, roles, accessToken, refreshToken } = res.data.data || {};
      const safeRoles =
        Array.isArray(roles) && roles.length
          ? roles
          : user?.role?.roleName
          ? [user.role.roleName]
          : [];

      const payload = {
        ...user,
        roles: safeRoles,
        role: safeRoles?.[0] || null,
        accessToken,
        refreshToken,
        googlePhotoURL: profile?.photoURL,
        firebaseUid: profile?.uid,
      };

      dispatch(login(payload));
      if (accessToken) localStorage.setItem("token", accessToken);

      const isTeacher = safeRoles
        .map((r) => (r || "").toUpperCase())
        .includes("TEACHER");

      toast.success(
        `Xin chào, ${
          user?.displayName ||
          user?.email ||
          profile?.displayName ||
          profile?.email
        }!`
      );
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

  // =========================
  // Forgot password handlers
  // =========================
  const openForgot = () => {
    setForgotOpen(true);
    setForgotStep(0);
    setForgotEmailOrPhone("");
    setForgotOtp("");
    forgotForm.resetFields();
    verifyForm.resetFields();
    resetForm.resetFields();
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setForgotStep(0);
    setForgotLoading(false);
  };

  const requestOtp = async (values) => {
    const emailOrPhone = (values.emailOrPhone || "").trim();
    if (!emailOrPhone) return;

    try {
      setForgotLoading(true);

      // API: POST /api/auth/forgot-password/request-otp
      await api.post("/auth/forgot-password/request-otp", { emailOrPhone });

      setForgotEmailOrPhone(emailOrPhone);
      toast.success("Đã gửi OTP. Vui lòng kiểm tra email!");
      setForgotStep(1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gửi OTP thất bại");
    } finally {
      setForgotLoading(false);
    }
  };

  const verifyOtp = async (values) => {
    const otpCode = (values.otpCode || "").trim();
    if (!otpCode) return;

    try {
      setForgotLoading(true);

      // API: POST /api/auth/forgot-password/verify-otp
      await api.post("/auth/forgot-password/verify-otp", {
        emailOrPhone: forgotEmailOrPhone,
        otpCode,
      });

      setForgotOtp(otpCode);
      toast.success("OTP hợp lệ!");
      setForgotStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.message || "OTP không hợp lệ");
    } finally {
      setForgotLoading(false);
    }
  };

  const resetPassword = async (values) => {
    const newPassword = values.newPassword || "";
    const confirmPassword = values.confirmPassword || "";

    try {
      setForgotLoading(true);

      // API: POST /api/auth/forgot-password/reset
      await api.post("/auth/forgot-password/reset", {
        emailOrPhone: forgotEmailOrPhone,
        otpCode: forgotOtp,
        newPassword,
        confirmPassword,
        passwordConfirmed: true,
      });

      toast.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại!");
      closeForgot();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reset mật khẩu thất bại");
    } finally {
      setForgotLoading(false);
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

            {/* ✅ Forgot password */}
            <Button type="link" style={{ padding: 0 }} onClick={openForgot}>
              Quên mật khẩu?
            </Button>
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

      {/* =========================
          Forgot Password Modal
         ========================= */}
      <Modal
        title="Quên mật khẩu"
        open={forgotOpen}
        onCancel={closeForgot}
        footer={null}
        destroyOnClose
      >
        <Steps
          current={forgotStep}
          items={forgotSteps}
          style={{ marginBottom: 16 }}
        />

        {forgotStep === 0 && (
          <Form form={forgotForm} layout="vertical" onFinish={requestOtp}>
            <Form.Item
              label="Email (hoặc SĐT nếu BE hỗ trợ)"
              name="emailOrPhone"
              rules={[
                { required: true, message: "Vui lòng nhập email để nhận OTP" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="user@example.com"
                autoFocus
              />
            </Form.Item>

            <Flex justify="end" gap={8}>
              <Button onClick={closeForgot}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={forgotLoading}>
                Gửi OTP
              </Button>
            </Flex>
          </Form>
        )}

        {forgotStep === 1 && (
          <Form form={verifyForm} layout="vertical" onFinish={verifyOtp}>
            <div style={{ marginBottom: 8, fontSize: 13, opacity: 0.8 }}>
              OTP đã được gửi tới: <b>{forgotEmailOrPhone}</b>
            </div>

            <Form.Item
              label="Nhập OTP"
              name="otpCode"
              rules={[
                { required: true, message: "Vui lòng nhập OTP" },
                {
                  len: OTP_LEN,
                  message: `OTP phải đủ ${OTP_LEN} số`,
                },
              ]}
            >
              <Input
                inputMode="numeric"
                placeholder="123456"
                maxLength={OTP_LEN}
              />
            </Form.Item>

            <Flex justify="space-between" gap={8}>
              <Button
                onClick={() => {
                  setForgotStep(0);
                  setForgotOtp("");
                  verifyForm.resetFields();
                }}
              >
                Quay lại
              </Button>

              <Flex gap={8}>
                <Button
                  onClick={() => forgotForm.submit()}
                  loading={forgotLoading}
                  disabled={!forgotEmailOrPhone}
                >
                  Gửi lại OTP
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={forgotLoading}
                >
                  Xác thực
                </Button>
              </Flex>
            </Flex>
          </Form>
        )}

        {forgotStep === 2 && (
          <Form form={resetForm} layout="vertical" onFinish={resetPassword}>
            <div style={{ marginBottom: 8, fontSize: 13, opacity: 0.8 }}>
              Tài khoản: <b>{forgotEmailOrPhone}</b>
            </div>

            <Form.Item
              label="Mật khẩu mới"
              name="newPassword"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới" },
                { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mật khẩu mới"
              />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              dependencies={["newPassword"]}
              hasFeedback
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu xác nhận không khớp")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập lại mật khẩu"
              />
            </Form.Item>

            <Flex justify="space-between" gap={8}>
              <Button
                onClick={() => {
                  setForgotStep(1);
                  resetForm.resetFields();
                }}
              >
                Quay lại
              </Button>

              <Button type="primary" htmlType="submit" loading={forgotLoading}>
                Đặt lại mật khẩu
              </Button>
            </Flex>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default LoginForm;
