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
    mk("dashboard", "Dashboard", <DashboardOutlined />, "/admin"),
    mk("users", "Users", <UserOutlined />, "/admin/users"),
    mk("catalog", "Catalog", <DatabaseOutlined />, "/admin/catalog"),
    mk(
      "moderation",
      "Moderation",
      <SafetyCertificateOutlined />,
      "/admin/moderation"
    ),
    mk("reports", "Reports", <ProfileOutlined />, "/admin/reports"),
    mk("settings", "Settings", <SettingOutlined />, "/admin/settings"),
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
    mk(
      "manage-documents",
      "Quản lý tài liệu",
      <BookOutlined />,
      "/teacher/manage-documents"
      // [
      //   mk(
      //     "videos",
      //     "Video",
      //     <VideoCameraOutlined />,
      //     "/teacher/manage-documents/videos"
      //   ),
      //   mk(
      //     "lessons",
      //     "Bài học",
      //     <ReadOutlined />,
      //     "/teacher/manage-documents/lessons"
      //   ),
      //   mk(
      //     "quiz",
      //     "Bài kiểm tra",
      //     <ProfileOutlined />,
      //     "/teacher/manage-documents/quiz"
      //   ),
      // ]
    ),
    mk("revenue", "Doanh thu", <DollarOutlined />, "/teacher/revenue"),
    mk("manage", "Quản lý", <SettingOutlined />, "/teacher/manage"),
    mk("profile", "Hồ sơ cá nhân", <UserOutlined />, "/teacher/profile"),
  ],
  admin: [
    mk("dashboard", "Tổng quan", <DashboardOutlined />, "/admin"),
    mk("users", "Quản lý người dùng", <UserOutlined />, "/admin/users"),
    mk("courses", "Quản lý khoá học", <BookOutlined />, "/admin/courses"),
    mk("finance", "Tài chính", <DollarOutlined />, "/admin/finance"),
    mk(
      "moderation",
      "Kiểm duyệt",
      <SafetyCertificateOutlined />,
      "/admin/moderation"
    ),
    mk("settings", "Cấu hình hệ thống", <SettingOutlined />, "/admin/settings"),
  ],
  moderator: [
    mk("dashboard", "Tổng quan", <DashboardOutlined />, "/moderator"),
    mk("queues", "Hàng đợi duyệt", <ClusterOutlined />, "/moderator/queues"),
    mk("content", "Nội dung", <BookOutlined />, "/moderator/content"),
    mk(
      "flags",
      "Cờ vi phạm",
      <SafetyCertificateOutlined />,
      "/moderator/flags"
    ),
    mk("messages", "Tin nhắn", <MessageOutlined />, "/moderator/messages"),
    mk("settings", "Cài đặt", <SettingOutlined />, "/moderator/settings"),
  ],
};

export const userDropdownMenu = [
  { key: "profile", label: "Profile" },
  { key: "settings", label: "Settings" },
  { type: "divider" },
  { key: "logout", label: "Log out" },
];
