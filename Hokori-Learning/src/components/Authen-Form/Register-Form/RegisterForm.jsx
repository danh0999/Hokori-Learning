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

// 🔑 Firebase login helpers (đã dùng ở LoginForm)
import {
  loginWithGoogle,
  mapFirebaseAuthError,
} from "../../../redux/features/auth";
import { useDispatch } from "react-redux";
import { login as saveUser } from "../../../redux/features/userSlice";
import { getAuth } from "firebase/auth";

const { Option } = Select;

const RegisterForm = () => {
  const [form] = Form.useForm();
  const [role, setRole] = useState("learner"); // "learner" | "teacher"
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // đổi tab → set default JLPT theo role
  useEffect(() => {
    form.setFieldsValue({
      currentJlptLevel: role === "teacher" ? "N1" : "N5",
    });
  }, [role, form]);

  // --- Handle register via Google (Firebase) ---
  const handleGoogleRegister = async () => {
    try {
      setLoadingGoogle(true);

      // 1️⃣ Đăng nhập Google qua Firebase
      const profile = await loginWithGoogle(); // hàm bạn có sẵn
      const user = getAuth().currentUser;
      if (!user)
        throw new Error("Không lấy được thông tin người dùng từ Firebase.");

      // 2️⃣ Lấy Firebase ID token để gửi lên BE
      const firebaseToken = await user.getIdToken();

      // 3️⃣ Gọi API /auth/firebase
      const res = await api.post("/auth/firebase", { firebaseToken });

      const {
        user: backendUser,
        roles,
        accessToken,
        refreshToken,
      } = res.data.data;

      // 4️⃣ Lưu vào Redux + localStorage
      const payload = {
        ...backendUser,
        roles,
        role: roles?.[0] || null,
        accessToken,
        refreshToken,
      };
      dispatch(saveUser(payload));
      localStorage.setItem("token", accessToken);

      toast.success(
        `Xin chào, ${backendUser.displayName || backendUser.email}!`
      );
      navigate("/");
    } catch (e) {
      console.error("Google register error:", e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Đăng ký bằng Google thất bại!"
      );
    } finally {
      setLoadingGoogle(false);
    }
  };

  // --- Handle register via classic form ---
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
              headline: values.headline || "",
              bio: values.bio || "",
              websiteUrl: values.websiteUrl || "",
              facebook: values.facebook || "",
              instagram: values.instagram || "",
              linkedin: values.linkedin || "",
              tiktok: values.tiktok || "",
              x: values.x || "",
              youtube: values.youtube || "",
              language: values.language || "Japanese",
              currentJlptLevel: values.currentJlptLevel || "N1",
            }
          : {
              username: values.username,
              email: values.email,
              password: values.password,
              displayName: values.displayName,
              country: values.country || "Vietnam",
              nativeLanguage: values.nativeLanguage || "Vietnamese",
              currentJlptLevel: values.currentJlptLevel || "N5",
            };

      await api.post(endpoint, payload);
      toast.success("Đăng ký thành công!");
      navigate("/login");
    } catch (e) {
      console.error("Register error:", e);
      toast.error(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
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

      {/* Google button */}
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

      {/* layout vertical để form vào giữa gọn gàng */}
      <Form
        form={form}
        name="register"
        layout="vertical"
        onFinish={onFinish}
        className={styles.antFormStretch}
        style={{ maxWidth: 560, margin: "0 auto" }}
        scrollToFirstError
      >
        {/* --- Common fields --- */}
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: "Vui lòng nhập username" }]}
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

        <Form.Item
          name="password"
          label="Password"
          hasFeedback
          rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        {/* --- Learner-only --- */}
        <Form.Item
          name="displayName"
          label="Nickname"
          hidden={role !== "learner"}
          rules={
            role === "learner"
              ? [{ required: true, message: "Vui lòng nhập nickname" }]
              : []
          }
        >
          <Input />
        </Form.Item>

        <Form.Item name="country" label="Quốc gia" hidden={role !== "learner"}>
          <Input placeholder="Vietnam" />
        </Form.Item>

        <Form.Item
          name="nativeLanguage"
          label="Tiếng mẹ đẻ"
          hidden={role !== "learner"}
        >
          <Input placeholder="Vietnamese" />
        </Form.Item>

        {/* --- Teacher-only --- */}
        <Form.Item
          name="firstName"
          label="First name"
          hidden={role !== "teacher"}
          rules={
            role === "teacher"
              ? [{ required: true, message: "Vui lòng nhập First name" }]
              : []
          }
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="Last name"
          hidden={role !== "teacher"}
          rules={
            role === "teacher"
              ? [{ required: true, message: "Vui lòng nhập Last name" }]
              : []
          }
        >
          <Input />
        </Form.Item>

        <Form.Item name="headline" label="Headline" hidden={role !== "teacher"}>
          <Input placeholder="VD: JLPT N1 | 5 năm giảng dạy" />
        </Form.Item>

        <Form.Item name="bio" label="Bio" hidden={role !== "teacher"}>
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item
          name="websiteUrl"
          label="Website"
          hidden={role !== "teacher"}
        >
          <Input />
        </Form.Item>

        <Form.Item name="facebook" label="Facebook" hidden={role !== "teacher"}>
          <Input />
        </Form.Item>
        <Form.Item
          name="instagram"
          label="Instagram"
          hidden={role !== "teacher"}
        >
          <Input />
        </Form.Item>
        <Form.Item name="linkedin" label="LinkedIn" hidden={role !== "teacher"}>
          <Input />
        </Form.Item>
        <Form.Item name="tiktok" label="TikTok" hidden={role !== "teacher"}>
          <Input />
        </Form.Item>
        <Form.Item name="x" label="X" hidden={role !== "teacher"}>
          <Input />
        </Form.Item>
        <Form.Item name="youtube" label="YouTube" hidden={role !== "teacher"}>
          <Input />
        </Form.Item>

        <Form.Item
          name="language"
          label="Ngôn ngữ dạy"
          hidden={role !== "teacher"}
        >
          <Input placeholder="Japanese" />
        </Form.Item>

        {/* --- Shared: JLPT --- */}
        <Form.Item
          name="currentJlptLevel"
          label="JLPT hiện tại"
          initialValue={role === "teacher" ? "N1" : "N5"}
        >
          <Select allowClear placeholder="Chọn cấp JLPT">
            {["N5", "N4", "N3", "N2", "N1"].map((l) => (
              <Option key={l} value={l}>
                {l}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Actions */}
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
