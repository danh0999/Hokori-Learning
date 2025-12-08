import React, { useEffect } from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
  Tag,
  Table,
  Dropdown,
  Button,
  Spin,
  Empty,
  Alert,
  Modal,
} from "antd";
import {
  BookOutlined,
  TeamOutlined,
  DollarOutlined,
  MessageOutlined,
  MoreOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import styles from "./styles.module.scss";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../../../configs/axios.js";
import {
  fetchTeacherProfile,
  selectTeacherApproved,
  selectTeacherProfileStatus,
} from "../../../redux/features/teacherprofileSlice.js";

const { warning } = Modal;

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);

  const isApproved = useSelector(selectTeacherApproved);
  const profileStatus = useSelector(selectTeacherProfileStatus);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/teacher/dashboard");
      setData(res.data?.data || {});
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    dispatch(fetchTeacherProfile());
  }, [dispatch]);

  const statusTag = (s) => {
    const map = {
      DRAFT: "default",
      PENDING_REVIEW: "warning",
      PUBLISHED: "success",
      REJECTED: "error",
    };
    return <Tag color={map[s] || "default"}>{s}</Tag>;
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
      width: 150,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 150,
      render: statusTag,
    },
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      width: 180,
    },
    {
      title: "",
      key: "actions",
      width: 100,
      render: () => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "view", label: "Xem" },
              { key: "edit", label: "Chỉnh sửa" },
              { key: "delete", danger: true, label: "Xóa" },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // ✅ Validate trước khi cho tạo course từ dashboard
  const handleCreateCourse = () => {
    if (profileStatus === "loading" || profileStatus === "idle") {
      // nhẹ nhàng thôi, không cần duration dài
      // (dùng key để message sau đó có thể bị ghi đè)
    }

    if (!isApproved) {
      warning({
        title: "Hồ sơ giáo viên chưa được duyệt",
        icon: <ExclamationCircleFilled />,
        content:
          "Vui lòng cập nhật Teacher Profile và gửi admin duyệt. Chỉ khi hồ sơ ở trạng thái APPROVED thì bạn mới có thể tạo và đăng bán khóa học.",
        okText: "Đi tới Teacher Profile",
        onOk: () => navigate("/teacher/profile"),
      });
      return;
    }

    navigate("/teacher/create-course");
  };

  if (loading)
    return (
      <div className={styles.loadingWrapper}>
        <Spin size="large" />
      </div>
    );

  if (!data)
    return (
      <div className={styles.loadingWrapper}>
        <Empty description="No Data" />
      </div>
    );

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Teacher Dashboard</h1>
          <p className={styles.subtitle}>
            Quản lý khóa học, theo dõi doanh thu và tương tác với học viên
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button type="primary" onClick={handleCreateCourse}>
            Tạo khóa học
          </Button>
        </div>
      </div>

      {/* 🔔 Thông báo ngay khi vừa login nếu chưa APPROVED */}
      {profileStatus === "succeeded" && !isApproved && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Hồ sơ giáo viên của bạn chưa được duyệt"
          description={
            <>
              Bạn cần hoàn thiện Teacher Profile và được admin duyệt (
              <b>APPROVED</b>) trước khi tạo và đăng bán khóa học. Vui lòng vào
              trang Teacher Profile để cập nhật thông tin & chứng chỉ.
            </>
          }
        />
      )}

      {/* KPI */}
      <Row gutter={[16, 16]} className={styles.kpiRow}>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <BookOutlined />
            </div>
            <Statistic
              title="Khoá học đã xuất bản"
              value={data.publishedCourses}
            />
            <div className={styles.kpiHint}>
              {data.draftsWaitingReview} bản nháp chờ duyệt
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <TeamOutlined />
            </div>
            <Statistic title="Tổng số học viên" value={data.activeStudents} />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <MessageOutlined />
            </div>
            <Statistic title="Bình luận" value={data.newComments} />
          </Card>
        </Col>
      </Row>

      {/* Recent Courses */}
      <Card title="Recent Courses" className={styles.tableCard}>
        <Table
          size="middle"
          rowKey="courseId"
          columns={columns}
          dataSource={data.recentCourses}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
}
