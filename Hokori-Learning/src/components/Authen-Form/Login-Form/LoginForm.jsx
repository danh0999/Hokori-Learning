import React, { useState } from "react";
import { LockOutlined, UserOutlined, GoogleOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Flex, Divider } from "antd";
import Title from "antd/es/typography/Title";
import styles from "./styles.module.scss";
import { useNavigate } from "react-router-dom";
import AuthLogo from "../Auth-Logo/AuthLogo";

// 🔑 Service đăng nhập Google (xem phần ghi chú bên dưới)
import { loginWithGoogle, mapFirebaseAuthError } from "../../../services/auth";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { login } from "../../../redux/features/userSlice";

const LoginForm = () => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const onFinish = (values) => {
    // TODO: xử lý login tài khoản/mật khẩu nếu bạn có backend riêng
    console.log("Received values of form: ", values);
  };
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registerBtn } = styles;

  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true);
      const profile = await loginWithGoogle();
      toast.success(`Xin chào, ${profile.displayName || profile.email}!`);
      dispatch(login(profile));
      navigate("/");
    } catch (e) {
      console.error(e);
      toast.error(mapFirebaseAuthError(e));
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
