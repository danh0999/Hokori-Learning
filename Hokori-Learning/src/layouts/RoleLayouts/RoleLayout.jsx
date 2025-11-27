import React, { useState } from "react";
import { Layout } from "antd";
import RoleHeader from "../RoleLayouts/Header/RoleHeader";
import RoleSidebar from "../RoleLayouts/Sidebar/RoleSideBar";
import styles from "./styles.module.scss";
import { Outlet } from "react-router-dom";
import DraftCoursesDock from "../../pages/Teacher/components/TeacherDraftDock/DraftCoursesDock.jsx"; // 👈 thêm

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

      {/* ⬇ chỉ teacher mới thấy dock, admin/mod không bị ảnh hưởng */}
      {role === "teacher" && <DraftCoursesDock />}
    </Layout>
  );
}
