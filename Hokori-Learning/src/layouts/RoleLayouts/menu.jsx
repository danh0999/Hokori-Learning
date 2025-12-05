// src/layouts/menu.js
import {
  DashboardOutlined,
  BookOutlined,
  VideoCameraOutlined,
  ReadOutlined,
  ProfileOutlined,
  TeamOutlined,
  DollarOutlined,
  MessageOutlined,
  SettingOutlined,
  AuditOutlined,
  ClusterOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

// helper tạo item AntD
const mk = (key, label, icon, path, children) => ({
  key,
  label,
  icon,
  path,
  children,
});

export const headerMenusByRole = {
  teacher: [
    mk("dashboard", "Dashboard", <DashboardOutlined />, "/teacher"),
    mk("my-courses", "My Courses", <BookOutlined />, "/teacher/my-courses"),
    mk(
      "create-course",
      "Create Course",
      <ReadOutlined />,
      "/teacher/create-course"
    ),
    mk("students", "Students", <TeamOutlined />, "/teacher/students"),
    mk("revenue", "Revenue", <DollarOutlined />, "/teacher/revenue"),
    mk("messages", "Messages", <MessageOutlined />, "/teacher/messages"),
  ],
  admin: [
    mk("dashboard", "Tổng quan", <DashboardOutlined />, "/admin"),
    mk("users", "Người dùng", <UserOutlined />, "/admin/users"),

    mk("complaints", "Khiếu nại", <ProfileOutlined />, "/admin/complaints"),
    mk("revenue", "Tài chính", <DollarOutlined />, "/admin/revenue"),
  ],

  moderator: [
    mk("dashboard", "Dashboard", <DashboardOutlined />, "/moderator"),
    mk("reviews", "Reviews", <AuditOutlined />, "/moderator/reviews"),
    mk("queues", "Queues", <ClusterOutlined />, "/moderator/queues"),
    mk("ai-check", "AI Check", <ExperimentOutlined />, "/moderator/ai-check"),
    mk("messages", "Messages", <MessageOutlined />, "/moderator/messages"),
  ],
};

export const sidebarMenusByRole = {
  teacher: [
    mk("dashboard", "Bảng điều khiển", <DashboardOutlined />, "/teacher"),
    mk(
      "manage-courses",
      "Quản lý khoá học",
      <BookOutlined />,
      "/teacher/manage-courses"
    ),
    mk("jlptevents", "Sự kiện JLPT", <BookOutlined />, "/teacher/jlptevents"),
    mk("revenue", "Doanh thu", <DollarOutlined />, "/teacher/revenue"),
    mk("profile", "Hồ sơ cá nhân", <UserOutlined />, "/teacher/profile"),
    mk("logout", "Đăng xuất", <LogoutOutlined />, "logout-action"),
  ],
  admin: [
    mk("dashboard", "Tổng quan", <DashboardOutlined />, "/admin"),
    mk("users", "Người dùng", <UserOutlined />, "/admin/users"),

    mk(
      "teacher-certs",
      "Chứng chỉ GV",
      <ProfileOutlined />,
      "/admin/teacher-certificates"
    ),
    mk("events", "Sự kiện JLPT", <ReadOutlined />, "/admin/events"),
    mk("ai-packages", "Gói AI", <ExperimentOutlined />, "/admin/ai-packages"),
    mk("revenue", "Tài chính", <DollarOutlined />, "/admin/revenue"),
    mk(
      "withdrawals",
      "Rút tiền GV",
      <DatabaseOutlined />,
      "/admin/withdrawals"
    ),
    mk("complaints", "Khiếu nại", <ProfileOutlined />, "/admin/complaints"),
    // mk(
    //   "policies",
    //   "Chính sách",
    //   <SafetyCertificateOutlined />,
    //   "/admin/policies"
    // ),
    mk("system-logs", "System Log", <SettingOutlined />, "/admin/system-logs"),
    mk("logout", "Đăng xuất", <LogoutOutlined />, "logout-action"),
  ],
  moderator: [
    mk("dashboard", "Tổng quan", <DashboardOutlined />, "/moderator"),
    mk("queues", "Hàng đợi duyệt", <ClusterOutlined />, "/moderator/queues"),
    mk("jlptevents", "Sự kiện JLPT", <BookOutlined />, "/moderator/jlptevents"),
    mk(
      "flags",
      "Cờ vi phạm",
      <SafetyCertificateOutlined />,
      "/moderator/flags"
    ),
    mk("logout", "Đăng xuất", <LogoutOutlined />, "logout-action"),
  ],
};

export const userDropdownMenu = [
  { key: "profile", label: "Profile" },
  { key: "settings", label: "Settings" },
  { key: "logout", label: "Log out" },
];
