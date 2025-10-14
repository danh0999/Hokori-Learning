// src/layouts/rolesidebar.jsx
import React, { useMemo } from "react";
import { Button, Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { sidebarMenusByRole } from "../menu.jsx";
import styles from "./styles.module.scss";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";

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
    const hit = items.find((i) => pathname.startsWith(i.path));
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
