// src/pages/Authen-Form/Register-Form/RegisterForm.jsx
import { Button, Form, Input, Select, Tabs, Divider } from "antd";
import { GoogleOutlined } from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../../configs/axios";

import AuthLogo from "../Auth-Logo/AuthLogo";
import styles from "./styles.module.scss";

import { loginWithGoogle } from "../../../redux/features/auth";
import { useDispatch } from "react-redux";
import { login as saveUser } from "../../../redux/features/userSlice";
import { getAuth } from "firebase/auth";

const { Option } = Select;

const RegisterForm = () => {
  const [form] = Form.useForm();
  const [role, setRole] = useState("learner");
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Reset JLPT khi đổi tab
  useEffect(() => {
    form.setFieldsValue({
      currentJlptLevel: role === "teacher" ? "N1" : "N5",
    });
  }, [role, form]);

  // =============================
  //  GOOGLE REGISTER
  // =============================
  const handleGoogleRegister = async () => {
    try {
      setLoadingGoogle(true);

      await loginWithGoogle();
      const fbUser = getAuth().currentUser;
      if (!fbUser) throw new Error("Không lấy được tài khoản Google");

      const firebaseToken = await fbUser.getIdToken(true);

      const res = await api.post(
        "/auth/firebase/register",
        { firebaseToken },
        { headers: { Authorization: undefined } }
      );

      const { user, roles, accessToken, refreshToken } = res.data.data;

      dispatch(
        saveUser({
          ...user,
          roles,
          role: roles?.[0] || null,
          accessToken,
          refreshToken,
        })
      );

      localStorage.setItem("token", accessToken);

      toast.success(`Đăng ký thành công bằng Google. Xin chào ${user?.displayName || user?.email}!`);

      navigate(roles?.includes("TEACHER") ? "/teacher" : "/");
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message;
      if (status === 409) {
        toast.info("Email đã tồn tại. Vui lòng đăng nhập bằng Google.");
        navigate("/login");
        return;
      }
      toast.error(msg || "Đăng ký Google thất bại!");
    } finally {
      setLoadingGoogle(false);
    }
  };

  // =============================
  // EMAIL REGISTER
  // =============================
  const onFinish = async (values) => {
    setLoading(true);

    try {
      const endpoint =
        role === "teacher"
          ? "/auth/register/teacher"
          : "/auth/register/learner";

      const payload =
        role === "teacher"
          ? {
              username: values.username,
              email: values.email,
              password: values.password,
              firstName: values.firstName,
              lastName: values.lastName,
              bio: values.bio || "",
              websiteUrl: values.websiteUrl || "",
              linkedin: values.linkedin || "",
              currentJlptLevel: values.currentJlptLevel || "N1",
            }
          : {
              username: values.username,
              email: values.email,
              password: values.password,
              displayName: values.displayName,
              currentJlptLevel: values.currentJlptLevel || "N5",
            };

      await api.post(endpoint, payload);

      toast.success("Đăng ký thành công!");
      navigate("/login");
    } catch (e) {
      toast.error(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Đăng ký thất bại!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerFormContainer}>
      <AuthLogo />

      <Title level={2} style={{ textAlign: "center", marginBottom: 8 }}>
        Đăng ký
      </Title>

      <Button
        block
        size="large"
        icon={<GoogleOutlined />}
        loading={loadingGoogle}
        onClick={handleGoogleRegister}
      >
        Đăng ký bằng Google
      </Button>

      <Divider plain>hoặc đăng ký bằng email</Divider>

      <Tabs
        activeKey={role}
        onChange={(k) => setRole(k)}
        centered
        items={[
          { key: "learner", label: "Học viên" },
          { key: "teacher", label: "Giáo viên" },
        ]}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className={styles.antFormStretch}
        style={{ maxWidth: 560, margin: "0 auto" }}
        scrollToFirstError
      >
        {/* COMMON FIELDS */}
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: "Vui lòng nhập Username" }]}
        >
          <Input autoComplete="username" />
        </Form.Item>

        <Form.Item
          name="email"
          label="E-mail"
          rules={[
            { type: "email", message: "Email không hợp lệ" },
            { required: true, message: "Vui lòng nhập email" },
          ]}
        >
          <Input autoComplete="email" />
        </Form.Item>

        {/* PASSWORD */}
        <Form.Item
          name="password"
          label="Password"
          hasFeedback
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu" },
            { min: 6, message: "Mật khẩu phải ít nhất 6 ký tự" },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        {/* CONFIRM PASSWORD */}
        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          dependencies={["password"]}
          hasFeedback
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Mật khẩu xác nhận không khớp!")
                );
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        {/* ======================== */}
        {/*  LEARNER ONLY */}
        {/* ======================== */}
        {role === "learner" && (
          <>
            <Form.Item
              name="displayName"
              label="Tên hiển thị"
              rules={[{ required: true, message: "Vui lòng nhập tên hiển thị" }]}
            >
              <Input />
            </Form.Item>
          </>
        )}

        {/* ======================== */}
        {/*  TEACHER ONLY */}
        {/* ======================== */}
        {role === "teacher" && (
          <>
            <Form.Item
              name="firstName"
              label="First name"
              rules={[{ required: true, message: "Vui lòng nhập First name" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="lastName"
              label="Last name"
              rules={[{ required: true, message: "Vui lòng nhập Last name" }]}
            >
              <Input />
            </Form.Item>

            {/* Bio — giới hạn 200 ký tự */}
            <Form.Item
              name="bio"
              label="Giới thiệu (tối đa 200 ký tự)"
              rules={[
                {
                  max: 200,
                  message: "Bio tối đa 200 ký tự!",
                },
              ]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Giới thiệu ngắn gọn về kinh nghiệm giảng dạy hoặc thành tựu…"
                maxLength={200}
                showCount
              />
            </Form.Item>

            <Form.Item name="websiteUrl" label="Website (nếu có)">
              <Input placeholder="https://your-website.com" />
            </Form.Item>

            <Form.Item name="linkedin" label="LinkedIn (nếu có)">
              <Input placeholder="https://linkedin.com/in/your-profile" />
            </Form.Item>
          </>
        )}

        {/* JLPT LEVEL */}
        <Form.Item name="currentJlptLevel" label="JLPT hiện tại">
          <Select allowClear placeholder="Chọn cấp JLPT">
            {["N5", "N4", "N3", "N2", "N1"].map((l) => (
              <Option key={l} value={l}>
                {l}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* SUBMIT */}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Đăng ký {role === "teacher" ? "Giáo viên" : "Học viên"}
          </Button>
          <div className={styles.extraLinks}>
            hoặc{" "}
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
            >
              Đăng nhập ngay!
            </a>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegisterForm;
