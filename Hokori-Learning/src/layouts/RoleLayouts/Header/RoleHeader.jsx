// src/layouts/roleheader.jsx
import React from "react";
import { Layout, Menu, Space, Badge, Dropdown, Avatar } from "antd";
import { BellOutlined, UserOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { headerMenusByRole, userDropdownMenu } from "../menu.jsx";
import styles from "./styles.module.scss";

const { Header } = Layout;

export default function RoleHeader({ role = "teacher", user }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const items = headerMenusByRole[role] || [];
  const selectedKey =
    items.find((i) => pathname.startsWith(i.path))?.key || items[0]?.key;

  const onTopMenuClick = ({ key }) => {
    const hit = items.find((i) => i.key === key);
    if (hit?.path) navigate(hit.path);
  };

  const onUserMenuClick = ({ key }) => {
    if (key === "profile") navigate(`/${role}/profile`);
    if (key === "logout") {
      // TODO: dispatch logout
    }
  };

  return (
    <Header className={styles.headerBar}>
      {/* Brand */}
      <div className={styles.logo} onClick={() => navigate(`/${role}`)}>
        <div className={styles.logoBox}>
          <span className={styles.logoText}>H</span>
        </div>
        <span className={styles.brand}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      </div>

      {/* Top nav */}
      {/* <Menu
        theme="white"
        mode="horizontal"
        selectedKeys={selectedKey ? [selectedKey] : []}
        items={items.map(({ key, label, icon }) => ({ key, label, icon }))}
        onClick={onTopMenuClick}
        className={styles.headerMenu}
      /> */}

      {/* Right zone */}
      <Space size={16} className={styles.rightZone}>
        <Badge dot>
          <BellOutlined
            className={styles.bellIcon}
            onClick={() => navigate(`/${role}/notifications`)}
          />
        </Badge>
        <Dropdown
          menu={{ items: userDropdownMenu, onClick: onUserMenuClick }}
          trigger={["click"]}
        >
          <div className={styles.avatarWrap}>
            <Avatar shape="square" icon={<UserOutlined />} />
            <span className={styles.displayName}>
              {user?.username || "User"}
            </span>
          </div>
        </Dropdown>
      </Space>
    </Header>
  );
}
