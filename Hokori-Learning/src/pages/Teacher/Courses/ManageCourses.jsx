import React, { useMemo, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Input,
  Select,
  Space,
  Button,
  Dropdown,
  message,
  Modal,
} from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  MoreOutlined,
  PlusOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.scss";

const { confirm } = Modal;

const mock = [
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
  {
    id: 4,
    title: "Pronunciation Workshop",
    code: "PRON-150",
    students: 65,
    rating: 4.2,
    status: "Draft",
    updatedAt: "2025-10-06",
  },
  {
    id: 5,
    title: "N2 Reading Practice",
    code: "N2-RD-330",
    students: 120,
    rating: 4.6,
    status: "Rejected",
    updatedAt: "2025-10-02",
  },
  {
    id: 6,
    title: "Hiragana & Katakana",
    code: "BAS-ALPHA",
    students: 512,
    rating: 4.9,
    status: "Published",
    updatedAt: "2025-09-28",
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

export default function ManageCourses() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [data, setData] = useState(mock);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return data.filter((c) => {
      const okQuery =
        !q ||
        c.title.toLowerCase().includes(q.toLowerCase()) ||
        c.code.toLowerCase().includes(q.toLowerCase());
      const okStatus = status === "All" || c.status === status;
      return okQuery && okStatus;
    });
  }, [q, status, data]);

  const onSubmitForReview = (id) => {
    setData((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "Review" } : c))
    );
    message.success("Submitted for review");
  };

  const onDuplicate = (row) => {
    const copy = {
      ...row,
      id: Date.now(),
      code: row.code + "-COPY",
      status: "Draft",
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setData((prev) => [copy, ...prev]);
    message.success("Duplicated");
  };

  const onDelete = (id) => {
    confirm({
      title: "Delete this course?",
      icon: <ExclamationCircleFilled />,
      content: "This action cannot be undone.",
      okType: "danger",
      onOk: () => setData((prev) => prev.filter((c) => c.id !== id)),
    });
  };

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
      width: 130,
      render: statusTag,
    },
    { title: "Updated", dataIndex: "updatedAt", key: "updatedAt", width: 140 },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      render: (_, row) => {
        const items = [
          {
            key: "manage",
            label: "Manage",
            onClick: () => navigate(`/teacher/courseinfo/${row.id}`),
          },
          ...(row.status === "Draft"
            ? [
                {
                  key: "submit",
                  label: "Submit for review",
                  onClick: () => onSubmitForReview(row.id),
                },
              ]
            : []),
          { key: "dup", label: "Duplicate", onClick: () => onDuplicate(row) },
          { type: "divider" },
          {
            key: "del",
            danger: true,
            label: "Delete",
            onClick: () => onDelete(row.id),
          },
        ];
        return (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: items.map(({ key, label, danger, onClick, type }) =>
                type === "divider" ? { type } : { key, label, danger, onClick }
              ),
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Manage Courses</h1>
          <p className={styles.subtitle}>
            Create, update, and manage your courses
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/teacher/create-course")}
        >
          New Course
        </Button>
      </div>

      <Card className={styles.filterBar}>
        <Space wrap size={[8, 8]}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search title or code"
            className={styles.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            className={styles.select}
            value={status}
            onChange={setStatus}
            options={["All", "Draft", "Review", "Published", "Rejected"].map(
              (v) => ({ label: v, value: v })
            )}
          />
          <Button icon={<CalendarOutlined />}>Date</Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={filtered}
          pagination={{ defaultPageSize: 8 }}
        />
      </Card>
    </div>
  );
}
