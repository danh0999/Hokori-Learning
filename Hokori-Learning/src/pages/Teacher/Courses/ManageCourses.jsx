// src/pages/Teacher/Courses/ManageCourses/ManageCourses.jsx
import React, { useEffect, useMemo, useState } from "react";
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
import { useDispatch, useSelector } from "react-redux";

import {
  fetchTeacherCourses,
  deleteCourseThunk,
} from "../../../redux/features/teacherCourseSlice";
import styles from "./styles.module.scss";

// const { confirm } = Modal;

// helper: render Tag status
const statusTag = (s) => {
  const map = {
    Draft: "default",
    Review: "warning",
    Published: "success",
    Rejected: "error",
  };
  return <Tag color={map[s] || "default"}>{s}</Tag>;
};

// helper: map enum BE → text status ở bảng
const mapStatusLabel = (status) => {
  if (!status) return "Draft";

  switch (status) {
    case "DRAFT":
      return "Draft";
    case "PUBLISHED":
      return "Published";
    case "REVIEWING":
    case "IN_REVIEW":
      return "Review";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
};

export default function ManageCourses() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { list, listLoading } = useSelector((state) => state.teacherCourse);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [data, setData] = useState([]); // rows đang hiển thị (sau khi map từ list)

  // gọi API lấy danh sách course 1 lần
  useEffect(() => {
    dispatch(fetchTeacherCourses());
  }, [dispatch]);

  // chuẩn hoá dữ liệu từ Redux → rows cho Table
  const tableData = useMemo(() => {
    // list có thể là [], hoặc {content:[...]} hoặc object khác → ép về array an toàn
    let raw = list;
    if (Array.isArray(raw)) {
      // ok
    } else if (Array.isArray(raw?.content)) {
      raw = raw.content;
    } else {
      raw = [];
    }

    return raw.map((c) => {
      const statusLabel = mapStatusLabel(c.status);

      return {
        id: c.id,
        title: c.title,
        code: c.slug || c.code || `COURSE-${c.id}`,
        students: c.studentsCount ?? c.enrolledCount ?? 0,
        rating: c.rating ?? c.averageRating ?? "-",
        status: statusLabel,
        updatedAt: (c.updatedAt || c.publishedAt || c.createdAt || "").slice(
          0,
          10
        ),
      };
    });
  }, [list]);

  // mỗi khi data từ Redux đổi → sync vào local state để filter / duplicate...
  useEffect(() => {
    setData(tableData);
  }, [tableData]);

  // filter theo search + status
  const filtered = useMemo(() => {
    return (data || []).filter((c) => {
      const okQuery =
        !q ||
        c.title?.toLowerCase().includes(q.toLowerCase()) ||
        c.code?.toLowerCase().includes(q.toLowerCase());

      const okStatus = status === "All" || c.status === status;

      return okQuery && okStatus;
    });
  }, [q, status, data]);

  // mấy action tạm thời chỉ thao tác frontend (chưa call BE)
  const onSubmitForReview = (id) => {
    setData((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "Review",
            }
          : c
      )
    );
    message.success("Submitted for review (frontend only).");
  };

  const onDelete = async (id) => {
    console.log("[ManageCourses] onDelete DIRECT CALL with id =", id);

    try {
      const result = await dispatch(deleteCourseThunk(id)).unwrap();
      console.log("[ManageCourses] deleteCourseThunk SUCCESS:", result);

      // Xoá luôn ở UI cho chắc
      setData((prev) => prev.filter((c) => String(c.id) !== String(id)));

      message.success("Deleted course.");
      // Nếu muốn sync lại từ BE:
      // await dispatch(fetchTeacherCourses());
    } catch (err) {
      console.error("[ManageCourses] deleteCourseThunk ERROR:", err);
      message.error(err || "Delete failed. Please try again.");
    }
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
    {
      title: "Students",
      dataIndex: "students",
      key: "students",
      width: 120,
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      width: 100,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: statusTag,
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 140,
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      render: (_, row) => {
        const items = [
          {
            key: "manage",
            label: "Manage",
          },
          ...(row.status === "Draft"
            ? [
                {
                  key: "submit",
                  label: "Submit for review",
                },
              ]
            : []),

          {
            key: "del",
            danger: true,
            label: "Delete",
          },
        ];

        return (
          <Dropdown
            trigger={["click"]}
            menu={{
              items,
              onClick: ({ key }) => {
                console.log(
                  "[ManageCourses] Dropdown clicked:",
                  key,
                  "courseId =",
                  row.id
                );

                if (key === "manage") {
                  navigate(`/teacher/courseinfo/${row.id}`);
                } else if (key === "submit") {
                  onSubmitForReview(row.id);
                } else if (key === "del") {
                  onDelete(row.id);
                }
              },
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
          loading={listLoading}
          pagination={{ defaultPageSize: 8 }}
        />
      </Card>
    </div>
  );
}
