// src/layouts/rolesidebar.jsx
import React, { useMemo } from "react";
import { Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { sidebarMenusByRole } from "../menu.jsx";
import styles from "./styles.module.scss";

const { Sider } = Layout;

export default function RoleSidebar({
  role = "teacher",
  collapsed,
  onCollapse,
  width = 240,
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const items = sidebarMenusByRole[role] || [];

  const selectedKeys = useMemo(() => {
    // Chuẩn hóa path (bỏ slash cuối nếu có)
    const norm = (p) => (p.endsWith("/") && p !== "/" ? p.slice(0, -1) : p);
    const cur = norm(pathname);

    // 1) ưu tiên khớp tuyệt đối
    let hit =
      items.find((i) => norm(i.path) === cur) ||
      // 2) nếu không có, lấy path khớp tiền tố nhưng DÀI NHẤT
      items
        .filter((i) => cur.startsWith(norm(i.path)))
        .sort((a, b) => norm(b.path).length - norm(a.path).length)[0];

    return hit?.key ? [hit.key] : [];
  }, [pathname, items]);

  const onClick = ({ key }) => {
    const hit = items.find((i) => i.key === key);
    if (hit?.path) navigate(hit.path);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      className={styles.sider}
      width={width}
    >
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        items={items.map(({ key, label, icon }) => ({ key, icon, label }))}
        onClick={onClick}
      />
    </Sider>
  );
}
