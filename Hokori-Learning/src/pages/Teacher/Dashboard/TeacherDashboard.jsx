import React from "react";
import { Card, Col, Row, Statistic, Tag, Table, Dropdown, Button } from "antd";
import {
  BookOutlined,
  TeamOutlined,
  DollarOutlined,
  MessageOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import styles from "./styles.module.scss";
import { useNavigate } from "react-router-dom";

const recentCourses = [
  {
    id: 1,
    title: "JLPT N5 Grammar Basics",
    code: "N5-GR-101",
    students: 210,
    rating: 4.7,
    status: "Published",
    updatedAt: "2025-10-10",
  },
  {
    id: 2,
    title: "Kanji 100 – Starter",
    code: "KJI-100",
    students: 98,
    rating: 4.5,
    status: "Review",
    updatedAt: "2025-10-11",
  },
  {
    id: 3,
    title: "N3 Listening Drills",
    code: "N3-LS-220",
    students: 320,
    rating: 4.8,
    status: "Published",
    updatedAt: "2025-10-09",
  },
];

const statusTag = (s) => {
  const map = {
    Draft: "default",
    Review: "warning",
    Published: "success",
    Rejected: "error",
  };
  return <Tag color={map[s] || "default"}>{s}</Tag>;
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const columns = [
    {
      title: "Course",
      dataIndex: "title",
      key: "title",
      render: (v, r) => (
        <div className={styles.courseCol}>
          <div className={styles.courseTitle}>{v}</div>
          <div className={styles.courseCode}>{r.code}</div>
        </div>
      ),
    },
    { title: "Students", dataIndex: "students", key: "students", width: 120 },
    { title: "Rating", dataIndex: "rating", key: "rating", width: 100 },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: statusTag,
    },
    { title: "Updated", dataIndex: "updatedAt", key: "updatedAt", width: 140 },
    {
      title: "",
      key: "actions",
      width: 60,
      render: () => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "view", label: "View" },
              { key: "edit", label: "Edit" },
              { type: "divider" },
              { key: "delete", danger: true, label: "Delete" },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Teacher Dashboard</h1>
          <p className={styles.subtitle}>
            Snapshot of your teaching performance
          </p>
        </div>
        <div
          className={styles.headerActions}
          type="primary"
          onClick={() => navigate("/teacher/create-course")}
        >
          <Button type="primary">New Course</Button>
        </div>
      </div>

      <Row gutter={[16, 16]} className={styles.kpiRow}>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <TeamOutlined />
            </div>
            <Statistic title="Active Students" value={1218} />
            <div className={styles.kpiHint}>+5% vs last month</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <BookOutlined />
            </div>
            <Statistic title="Published Courses" value={12} />
            <div className={styles.kpiHint}>2 drafts waiting review</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <DollarOutlined />
            </div>
            <Statistic title="Monthly Revenue" value={4820} prefix="$" />
            <div className={styles.kpiHint}>Payout on 25th</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <MessageOutlined />
            </div>
            <Statistic title="Unread Messages" value={7} />
            <div className={styles.kpiHint}>Respond within 24h</div>
          </Card>
        </Col>
      </Row>

      <Card title="Recent Courses" className={styles.tableCard}>
        <Table
          size="middle"
          rowKey="id"
          columns={columns}
          dataSource={recentCourses}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
}
