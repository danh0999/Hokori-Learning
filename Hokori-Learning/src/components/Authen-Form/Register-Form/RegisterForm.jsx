// src/pages/Authen-Form/Register-Form/RegisterForm.jsx
import { Button, Form, Input, Select, Tabs, Divider, Modal } from "antd";
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

  // ==== GOOGLE STATES ====
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleRoleModal, setGoogleRoleModal] = useState(false);
  const [selectedGoogleRole, setSelectedGoogleRole] = useState("LEARNER"); // "LEARNER" | "TEACHER"

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Reset JLPT khi đổi tab (email register)
  useEffect(() => {
    form.setFieldsValue({
      currentJlptLevel: role === "teacher" ? "N1" : "N5",
    });
  }, [role, form]);

  // =============================
  //  GOOGLE REGISTER (FLOW MỚI)
  // =============================

  // STEP 1: Bấm nút → mở modal chọn role
  const handleOpenGoogleRoleModal = () => {
    setGoogleRoleModal(true);
  };

  // STEP 2: Xác nhận role → login Google + gọi BE
  const handleConfirmGoogleRole = async () => {
    try {
      setLoadingGoogle(true);
      setGoogleRoleModal(false);

      // B1: login Google qua Firebase
      await loginWithGoogle();
      const fbUser = getAuth().currentUser;
      if (!fbUser) throw new Error("Không lấy được tài khoản Google");

      const firebaseToken = await fbUser.getIdToken(true);

      // B2: gọi API đăng ký với role (LEARNER/TEACHER)
      const res = await api.post(
        "/auth/firebase/register", // baseURL axios của bạn đã có /api ở sẵn
        {
          firebaseToken,
          role: selectedGoogleRole, // MUST: "LEARNER" | "TEACHER"
        },
        {
          // không attach token cũ để tránh 403
          headers: { Authorization: undefined },
        }
      );

      const {
        user,
        accessToken,
        refreshToken,
        roles,
        role: responseRole,
      } = res.data.data || {};

      // chọn role cuối cùng: ưu tiên field role, sau đó tới roles[0], cuối cùng fallback selectedGoogleRole
      const finalRole =
        responseRole ||
        (Array.isArray(roles) ? roles[0] : null) ||
        selectedGoogleRole;

      // Lưu user + token mới vào Redux
      dispatch(
        saveUser({
          ...user,
          roles: roles || [finalRole],
          role: finalRole,
          accessToken,
          refreshToken,
        })
      );

      // QUAN TRỌNG: lưu accessToken mới (BE dùng token này đã có roles)
      localStorage.setItem("token", accessToken);

      toast.success(
        `Đăng ký thành công bằng Google. Xin chào ${
          user?.displayName || user?.email
        }!`
      );

      // Redirect theo role
      if (finalRole === "TEACHER") {
        navigate("/teacher");
      } else {
        navigate("/");
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Đăng ký Google thất bại!";

      if (status === 409 || msg.includes("Email already exists")) {
        toast.info("Email đã tồn tại. Vui lòng đăng nhập.");
        navigate("/login");
        return;
      }

      toast.error(msg);
    } finally {
      setLoadingGoogle(false);
    }
  };

  // =============================
  // EMAIL REGISTER (giữ nguyên)
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

  // =============================
  // RENDER
  // =============================
  return (
    <div className={styles.registerFormContainer}>
      <AuthLogo />

      <Title level={2} style={{ textAlign: "center", marginBottom: 8 }}>
        Đăng ký
      </Title>

      {/* Nút đăng ký bằng Google */}
      <Button
        block
        size="large"
        icon={<GoogleOutlined />}
        loading={loadingGoogle}
        onClick={handleOpenGoogleRoleModal}
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

        {/* LEARNER ONLY */}
        {role === "learner" && (
          <Form.Item
            name="displayName"
            label="Tên hiển thị"
            rules={[{ required: true, message: "Vui lòng nhập tên hiển thị" }]}
          >
            <Input />
          </Form.Item>
        )}

        {/* TEACHER ONLY */}
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

            <Form.Item
              name="bio"
              label="Giới thiệu (tối đa 500 ký tự)"
              rules={[
                {
                  max: 500,
                  message: "Bio tối đa 500 ký tự!",
                },
              ]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Giới thiệu ngắn gọn về kinh nghiệm giảng dạy hoặc thành tựu…"
                maxLength={500}
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

        {/* SUBMIT EMAIL REGISTER */}
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

      {/* MODAL CHỌN ROLE TRƯỚC KHI LOGIN GOOGLE */}
      <Modal
        open={googleRoleModal}
        title="Chọn loại tài khoản"
        centered
        footer={null}
        onCancel={() => setGoogleRoleModal(false)}
      >
        <p>Bạn muốn đăng ký bằng Google với vai trò nào?</p>

        <Button
          block
          type={selectedGoogleRole === "LEARNER" ? "primary" : "default"}
          style={{ marginBottom: 8 }}
          onClick={() => setSelectedGoogleRole("LEARNER")}
        >
          Học viên (LEARNER)
        </Button>

        <Button
          block
          type={selectedGoogleRole === "TEACHER" ? "primary" : "default"}
          onClick={() => setSelectedGoogleRole("TEACHER")}
        >
          Giáo viên (TEACHER)
        </Button>

        <Button
          block
          type="primary"
          style={{ marginTop: 20 }}
          loading={loadingGoogle}
          onClick={handleConfirmGoogleRole}
        >
          Tiếp tục với Google
        </Button>
      </Modal>
    </div>
  );
};

export default RegisterForm;
