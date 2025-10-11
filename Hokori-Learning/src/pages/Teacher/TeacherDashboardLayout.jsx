import React from "react";
import {
  LaptopOutlined,
  NotificationOutlined,
  UserOutlined,
  BellOutlined,
} from "@ant-design/icons";
import {
  Breadcrumb,
  Layout,
  Menu,
  theme,
  Badge,
  Avatar,
  Dropdown,
  Space,
  Tooltip,
  Button,
} from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
const { Header, Content, Sider } = Layout;
const headerMenuItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "my-courses", label: "My Courses" },
  { key: "create-course", label: "Create Course" },
  { key: "students", label: "Students" },
  { key: "revenue", label: "Revenue" },
  { key: "messages", label: "Messages" },
];
import styles from "./styles.module.scss";
import { useSelector } from "react-redux";
const TeacherDashboardLayout = () => {
  const user = useSelector((state) => state.user);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // map route -> selected key (tuỳ router của bạn)
  const selectedKey = pathname.startsWith("/teacher/my-courses")
    ? "my-courses"
    : pathname.startsWith("/teacher/create-course")
    ? "create-course"
    : pathname.startsWith("/teacher/students")
    ? "students"
    : pathname.startsWith("/teacher/revenue")
    ? "revenue"
    : pathname.startsWith("/teacher/messages")
    ? "messages"
    : "dashboard";

  const handleTopMenuClick = ({ key }) => {
    navigate(`/teacher/${key === "dashboard" ? "" : key}`);
  };

  const userMenu = {
    items: [
      { key: "profile", label: "Profile" },
      { key: "settings", label: "Settings" },
      { type: "divider" },
      { key: "logout", label: "Log out" },
    ],
    onClick: ({ key }) => {
      // TODO: điều hướng/dispatch Redux theo key
      if (key === "profile") navigate("/teacher/profile");
    },
  };
  return (
    <Layout>
      <Header className={styles.headerBar}>
        {/* Logo */}
        <div className={styles.logo} onClick={() => navigate("/teacher")}>
          <div className={styles.logoBox}>
            <span className={styles.logoText}>H</span>
          </div>
          <span className={styles.brand}>Teacher</span>
        </div>

        {/* Menu giữa (cách logo một đoạn, chiếm flex) */}
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={headerMenuItems}
          onClick={handleTopMenuClick}
          className={styles.headerMenu}
        />

        {/* Khu vực bên phải: chuông + avatar */}
        <Space size={16} className={styles.rightZone}>
          <Badge dot>
            <BellOutlined
              className={styles.bellIcon}
              onClick={() => navigate("/teacher/notifications")}
            />
          </Badge>

          <Dropdown menu={userMenu} trigger={["click"]}>
            <div className={styles.avatarWrap}>
              {/* TODO: thay bằng ảnh & tên từ Redux */}
              <Avatar shape="square" icon={<UserOutlined />} />
              <span className={styles.displayName}>{user?.username}</span>
            </div>
          </Dropdown>
        </Space>
      </Header>
      <Layout>
        <Layout style={{ padding: "0 24px 24px" }}>
          <Breadcrumb
            items={[
              { title: "Home" },
              { title: "List" },
              { title: "TeacherDashboardLayout" },
            ]}
            style={{ margin: "16px 0" }}
          />
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};
export default TeacherDashboardLayout;
