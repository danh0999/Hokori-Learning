import React from "react";
import { Layout, Space, Badge, Dropdown, Avatar } from "antd";
import { BellOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../../redux/features/userSlice.js";
import { logoutFirebase } from "../../../redux/features/auth.js"; // ✅ import hàm logout Firebase
import { userDropdownMenu } from "../menu.jsx";
import styles from "./styles.module.scss";
import NotificationBell from "../../../components/NotificationBell/NotificationBell.jsx";

const { Header } = Layout;

export default function RoleHeader({ role = "teacher", user }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onUserMenuClick = async ({ key }) => {
    if (key === "profile") {
      navigate(`/${role}/profile`);
    }

    if (key === "logout") {
      try {
        //  Logout Firebase (nếu user đăng nhập bằng Google/Firebase)
        await logoutFirebase();

        //  Xoá Redux + token
        dispatch(logout());

        //  Chuyển hướng
        navigate("/login", { replace: true });
      } catch (err) {
        console.error("Logout failed:", err);
      }
    }
  };

  return (
    <Header className={`${styles.headerBar} notification-dark`}>
      {/* Brand */}
      <div className={styles.logo} onClick={() => navigate(`/${role}`)}>
        <div className={styles.logoBox}>
          <span className={styles.logoText}>H</span>
        </div>
        <span className={styles.brand}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      </div>

      {/* Right zone */}
      <Space size={16} className={styles.rightZone}>
        <NotificationBell />
      </Space>
    </Header>
  );
}
