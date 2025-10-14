import React, { useState } from "react";
import { Layout } from "antd";
import RoleHeader from "../RoleLayouts/Header/RoleHeader";
import RoleSidebar from "../RoleLayouts/Sidebar/RoleSideBar";
import styles from "./styles.module.scss";
import { Outlet } from "react-router-dom";

const { Content } = Layout;

export default function RoleLayout({ role = "teacher", user }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className={styles.shell}>
      <RoleHeader role={role} user={user} />
      <Layout hasSider>
        <RoleSidebar
          role={role}
          collapsed={collapsed}
          onCollapse={setCollapsed}
        />
        <Layout className={styles.contentWrap}>
          <Content className={styles.contentCard}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
