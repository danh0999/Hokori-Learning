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
  createCourseThunk,
} from "../../../redux/features/teacherCourseSlice";
import {
  fetchTeacherProfile,
  selectTeacherApproved,
  selectTeacherProfileStatus,
} from "../../../redux/features/teacherprofileSlice.js";
import styles from "./styles.module.scss";

const { warning } = Modal;

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
  const isApproved = useSelector(selectTeacherApproved);
  const profileStatus = useSelector(selectTeacherProfileStatus);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [data, setData] = useState([]); // rows đang hiển thị (sau khi map từ list)

  // gọi API lấy danh sách course & profile 1 lần
  useEffect(() => {
    dispatch(fetchTeacherCourses());
    dispatch(fetchTeacherProfile());
  }, [dispatch]);

  // chuẩn hoá dữ liệu từ Redux → rows cho Table
  const tableData = useMemo(() => {
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
        students: c.enrollCount ?? c.enrollCount ?? 0,
        rating: c.rating ?? c.averageRating ?? "-",
        status: statusLabel,
        updatedAt: (c.updatedAt || c.publishedAt || c.createdAt || "").slice(
          0,
          10
        ),
      };
    });
  }, [list]);

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
    try {
      const result = await dispatch(deleteCourseThunk(id)).unwrap();
      console.log("[ManageCourses] deleteCourseThunk SUCCESS:", result);

      setData((prev) => prev.filter((c) => String(c.id) !== String(id)));

      message.success("Deleted course.");
    } catch (err) {
      message.error(err || "Delete failed. Please try again.");
    }
  };

  // ✅ Validate trước khi cho tạo khoá mới
  const handleCreateCourse = () => {
    // nếu profile còn đang load thì nhắc nhẹ
    if (profileStatus === "loading" || profileStatus === "idle") {
      message.loading({
        content: "Đang kiểm tra trạng thái hồ sơ giáo viên...",
        key: "check-approval",
        duration: 0.8,
      });
    }

    if (!isApproved) {
      warning({
        title: "Hồ sơ giáo viên chưa được duyệt",
        icon: <ExclamationCircleFilled />,
        content:
          "Bạn cần cập nhật Teacher Profile và được admin duyệt (trạng thái APPROVED) trước khi tạo và đăng bán khóa học.",
        okText: "Đã hiểu",
      });
      return;
    }

    navigate("/teacher/create-course");
    const payload = {
      title: "Untitled course",
      subtitle: "",
      description: "",
      level: "N5",
      currency: "VND",
      priceCents: 0,
      discountedPriceCents: 0,
      coverAssetId: null,
    };

    message.loading({
      content: "Đang tạo khoá học nháp...",
      key: "create-course",
    });

    dispatch(createCourseThunk(payload))
      .unwrap()
      .then((course) => {
        message.success({
          content: "Đã tạo khoá học nháp.",
          key: "create-course",
        });
        navigate(`/teacher/create-course/${course.id}`);
      })
      .catch((err) => {
        console.error(err);
        message.error({
          content: "Tạo nháp khoá học thất bại, thử lại nhé.",
          key: "create-course",
        });
      });
  };

  const columns = [
    {
      title: "Khóa học",
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
      title: "Học viên",
      dataIndex: "students",
      key: "enrollCount",
      width: 120,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: statusTag,
    },
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 140,
    },
    {
      title: "Hành động",
      key: "actions",
      width: 110,
      render: (_, row) => {
        const isPublished = row.status === "Published";

        const items = [
          {
            key: "manage",
            label: "Quản lý",
          },
          ...(row.status === "Draft"
            ? [
                {
                  key: "submit",
                  label: "Gửi duyệt",
                },
              ]
            : []),
          ...(!isPublished
            ? [
                {
                  key: "del",
                  danger: true,
                  label: "Xóa",
                },
              ]
            : []),
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
                  // safety check thêm cho chắc
                  if (row.status === "Published") {
                    message.warning("Không thể xoá khoá học đã xuất bản.");
                    return;
                  }
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
          <h1 className={styles.title}>Quản lý khóa học</h1>
          <p className={styles.subtitle}>
            Tạo, cập nhật và quản lý các khóa học của bạn
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateCourse}
        >
          Tạo khoá học
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
            options={[
              "All",
              "Draft",
              "PENDING_APPROVAL",
              "Published",
              "Rejected",
            ].map((v) => ({ label: v, value: v }))}
          />
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
