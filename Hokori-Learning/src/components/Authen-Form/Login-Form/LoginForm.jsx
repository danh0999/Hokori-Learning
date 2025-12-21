import React, { useMemo, useState, useEffect } from "react";
import {
  LockOutlined,
  UserOutlined,
  GoogleOutlined,
  MailOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
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
  Alert,
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
const formatMMSS = (sec) => {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
};

const LoginForm = () => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(0); // 0 request-otp, 1 verify-otp, 2 reset
  const [forgotLoading, setForgotLoading] = useState(false);

  const [forgotEmailOrPhone, setForgotEmailOrPhone] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [otpLockedUntil, setOtpLockedUntil] = useState(null); // timestamp ms
  const [lockRemainSec, setLockRemainSec] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);
  const isOtpLocked = otpLockedUntil && otpLockedUntil > Date.now();

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
  useEffect(() => {
    if (!otpLockedUntil) return;

    const tick = () => {
      const remain = Math.max(
        0,
        Math.ceil((otpLockedUntil - Date.now()) / 1000)
      );
      setLockRemainSec(remain);
      if (remain <= 0) setOtpLockedUntil(null);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [otpLockedUntil]);

  const openForgot = () => {
    setForgotOpen(true);
    setForgotStep(0);
    setForgotEmailOrPhone("");
    setForgotOtp("");

    setOtpExpired(false);
    setOtpLockedUntil(null);
    setLockRemainSec(0);

    forgotForm.resetFields();
    verifyForm.resetFields();
    resetForm.resetFields();
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setForgotStep(0);
    setForgotLoading(false);

    setOtpExpired(false);
    setOtpLockedUntil(null);
    setLockRemainSec(0);
  };

  const requestOtp = async (values) => {
    const emailOrPhone = (values.emailOrPhone || "").trim();
    if (!emailOrPhone) return;

    // 🚫 Đang bị lock 30'
    if (otpLockedUntil && otpLockedUntil > Date.now()) {
      toast.error(
        `Bạn đang bị khóa tạm thời. Vui lòng thử lại sau ${formatMMSS(
          lockRemainSec
        )}.`
      );
      return;
    }

    try {
      setForgotLoading(true);

      await api.post("/auth/forgot-password/request-otp", { emailOrPhone });

      // ✅ Reset trạng thái cũ
      setOtpExpired(false);
      setOtpLockedUntil(null);
      setLockRemainSec(0);
      verifyForm.resetFields();

      setForgotEmailOrPhone(emailOrPhone);
      toast.success("Đã gửi OTP. Vui lòng kiểm tra email!");
      setForgotStep(1);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Gửi OTP thất bại";

      if (status === 429) {
        const retryAfterFromBody = err?.response?.data?.retryAfterSeconds;
        const retryAfterFromHeader = Number(
          err?.response?.headers?.["retry-after"]
        );
        const retryAfterSec = Number.isFinite(retryAfterFromBody)
          ? retryAfterFromBody
          : Number.isFinite(retryAfterFromHeader)
          ? retryAfterFromHeader
          : 30 * 60;

        setOtpLockedUntil(Date.now() + retryAfterSec * 1000);
        toast.error(msg);
        return;
      }

      toast.error(msg);
    } finally {
      setForgotLoading(false);
    }
  };
  const resendOtp = async () => {
    const emailOrPhone = (forgotEmailOrPhone || "").trim();
    if (!emailOrPhone) return;

    // đang lock thì không cho resend
    if (otpLockedUntil && otpLockedUntil > Date.now()) {
      toast.error(
        `Bạn đang bị khóa tạm thời. Vui lòng thử lại sau ${formatMMSS(
          lockRemainSec
        )}.`
      );
      return;
    }

    await requestOtp({ emailOrPhone }); // gọi lại đúng handler
  };

  const verifyOtp = async (values) => {
    const otpCode = (values.otpCode || "").trim();
    if (!otpCode) return;

    // Nếu đang bị khóa thì không gọi API nữa
    if (otpLockedUntil && otpLockedUntil > Date.now()) {
      toast.error(
        `Bạn đang bị khóa tạm thời. Thử lại sau ${formatMMSS(lockRemainSec)}.`
      );
      return;
    }

    try {
      setForgotLoading(true);
      setOtpExpired(false);

      await api.post("/auth/forgot-password/verify-otp", {
        emailOrPhone: forgotEmailOrPhone,
        otpCode,
      });

      setForgotOtp(otpCode);
      toast.success("OTP hợp lệ!");
      setForgotStep(2);
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message || err?.message || "OTP không hợp lệ";

      // ✅ 429 = lock brute-force
      if (status === 429) {
        // Ưu tiên lấy thời gian từ BE nếu có:
        // - retryAfterSeconds (data.retryAfterSeconds)
        // - hoặc header Retry-After
        const retryAfterFromBody = err?.response?.data?.retryAfterSeconds;
        const retryAfterFromHeader = Number(
          err?.response?.headers?.["retry-after"]
        );
        const retryAfterSec = Number.isFinite(retryAfterFromBody)
          ? retryAfterFromBody
          : Number.isFinite(retryAfterFromHeader)
          ? retryAfterFromHeader
          : 30 * 60; // fallback 30'

        const until = Date.now() + retryAfterSec * 1000;
        setOtpLockedUntil(until);
        setOtpExpired(false);

        toast.error(
          msg ||
            `Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau ${Math.ceil(
              retryAfterSec / 60
            )} phút.`
        );
        return;
      }

      // ✅ OTP hết hạn (tuỳ BE trả 400/410 + message)
      if (
        status === 410 ||
        (typeof msg === "string" &&
          (msg.toLowerCase().includes("hết hạn") ||
            msg.toLowerCase().includes("expired")))
      ) {
        setOtpExpired(true);
        toast.error(msg || "Mã OTP đã hết hạn. Vui lòng gửi lại mã.");
        return;
      }
      // Invalid OTP (sai OTP) + show remaining attempts nếu BE có trả
      const detail = err?.response?.data?.data;
      const msgFromBE =
        detail?.message ||
        err?.response?.data?.message ||
        "Mã OTP không chính xác";

      toast.error(msgFromBE);
      return;
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

      <Form
        name="login"
        className={styles.form}
        initialValues={{ remember: true }}
        onFinish={onFinish}
      >
        <Form.Item
          className={styles.formItem}
          name="username"
          rules={[{ required: true, message: "Vui lòng nhập username!" }]}
        >
          <Input
            className={styles.input}
            prefix={<UserOutlined />}
            placeholder="Username"
          />
        </Form.Item>

        <Form.Item
          className={styles.formItem}
          name="password"
          rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
        >
          <Input.Password
            className={styles.input}
            prefix={<LockOutlined />}
            placeholder="Password"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item className={styles.formItem}>
          <Flex justify="space-between" align="center">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox className={styles.checkbox}>Remember me</Checkbox>
            </Form.Item>

            <Button
              type="link"
              className={styles.forgotLink}
              onClick={openForgot}
            >
              Quên mật khẩu?
            </Button>
          </Flex>
        </Form.Item>

        <Form.Item className={styles.formItem}>
          <Button block className={styles.btnOutline} htmlType="submit">
            Đăng nhập
          </Button>

          <div className={styles.extraLinks}>
            or{" "}
            <a
              href="/register"
              className={styles.registerBtn}
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
            {isOtpLocked && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message="Gửi OTP tạm thời bị khóa"
                description={`Vui lòng thử lại sau ${formatMMSS(
                  lockRemainSec
                )}.`}
              />
            )}

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
              <Button
                type="primary"
                htmlType="submit"
                loading={forgotLoading}
                disabled={isOtpLocked}
              >
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
            {isOtpLocked && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message="Xác thực OTP tạm thời bị khóa"
                description={`Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau ${formatMMSS(
                  lockRemainSec
                )}.`}
              />
            )}

            {otpExpired && !isOtpLocked && (
              <Alert
                type="error"
                showIcon
                style={{ marginBottom: 12 }}
                message="Mã OTP đã hết hạn"
                description="Vui lòng nhấn “Gửi lại OTP” để nhận mã mới."
              />
            )}

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
                disabled={isOtpLocked}
                onChange={() => setOtpExpired(false)}
              />
            </Form.Item>

            <Flex justify="space-between" gap={8}>
              <Button
                onClick={() => {
                  setForgotStep(0);
                  setForgotOtp("");
                  setOtpExpired(false);
                  verifyForm.resetFields();
                }}
              >
                Quay lại
              </Button>

              <Flex gap={8}>
                <Button
                  onClick={resendOtp}
                  loading={forgotLoading}
                  disabled={!forgotEmailOrPhone || isOtpLocked}
                >
                  Gửi lại OTP
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={forgotLoading}
                  disabled={isOtpLocked}
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
