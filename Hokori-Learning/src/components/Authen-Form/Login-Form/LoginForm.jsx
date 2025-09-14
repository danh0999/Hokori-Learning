import React from "react";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Flex } from "antd";
import Title from "antd/es/typography/Title";
import styles from "./styles.module.scss";
import { useNavigate } from "react-router-dom";
import AuthLogo from "../Auth-Logo/AuthLogo";

const LoginForm = () => {
  const onFinish = (values) => {
    console.log("Received values of form: ", values);
  };
  const navigate = useNavigate();
  const { registerBtn } = styles;

  return (
    <div className={styles.loginFormContainer}>
      <AuthLogo />
      <Title level={2}>Đăng nhập</Title>
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
