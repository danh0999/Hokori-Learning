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
  message,
} from "antd";
import {
  BookOutlined,
  TeamOutlined,
  DollarOutlined,
  MessageOutlined,
  MoreOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import { deleteCourseThunk } from "../../../redux/features/teacherCourseSlice.js";
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
// ✅ map enum từ BE -> label giống ManageCourses
const mapStatusLabel = (status) => {
  if (!status) return "Bản nháp";

  switch (status) {
    case "DRAFT":
      return "Bản nháp";

    case "PUBLISHED":
      return "Đã xuất bản";

    case "PENDING_APPROVAL":
      return "Chờ duyệt";

    case "FLAGGED":
      return "Bị báo cáo";

    case "REJECTED":
      return "Bị từ chối";

    default:
      return status;
  }
};

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

  const statusTag = (statusEnum) => {
    const label = mapStatusLabel(statusEnum);

    const mapColor = {
      "Bản nháp": "default",
      "Đã xuất bản": "success",
      "Chờ duyệt": "warning",
      "Bị báo cáo": "error",
      "Bị từ chối": "error",
    };

    return <Tag color={mapColor[label] || "default"}>{label}</Tag>;
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
      title: "Trạng thái",
      dataIndex: "status",
      width: 200,
      render: statusTag,
    },
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      width: 200,
      render: (v) => {
        if (!v) return "-";
        const d = new Date(v);
        return d.toLocaleDateString("vi-VN"); // 👉 DD/MM/YYYY
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 110,
      render: (_, row) => {
        const courseId = row.courseId || row.id;

        // ✅ BE thường trả enum kiểu DRAFT/PUBLISHED/PENDING_APPROVED/FLAGGED...
        const nonDeletableStatuses = new Set([
          "PUBLISHED",
          "PENDING_APPROVAL",
          "FLAGGED",
        ]);
        const isNonDeletable = nonDeletableStatuses.has(row.status);

        const items = [
          { key: "manage", label: "Quản lý khóa học" },

          // ✅ chỉ hiện delete khi không bị chặn
          ...(!isNonDeletable
            ? [{ key: "delete", danger: true, label: "Xóa khóa học" }]
            : []),
        ];

        return (
          <Dropdown
            trigger={["click"]}
            menu={{
              items,
              onClick: async ({ key }) => {
                if (!courseId) return;

                if (key === "manage") {
                  navigate(`/teacher/courseinfo/${courseId}`);
                }

                if (key === "delete") {
                  if (isNonDeletable) {
                    message.warning("Không thể xoá khoá học ở trạng thái này.");
                    return;
                  }

                  Modal.confirm({
                    title: "Bạn có chắc muốn xóa khóa học này?",
                    content: "Hành động này không thể hoàn tác.",
                    okText: "Xóa",
                    okType: "danger",
                    cancelText: "Hủy",
                    onOk: async () => {
                      try {
                        await dispatch(deleteCourseThunk(courseId)).unwrap();
                        message.success("Xóa khóa học thành công!");
                        dispatch(fetchDashboard());
                      } catch (err) {
                        console.log(err);
                        message.error("Xóa thất bại! Vui lòng thử lại.");
                      }
                    },
                  });
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

  // ✅ Validate trước khi cho tạo course từ dashboard
  // const handleCreateCourse = () => {
  //   if (profileStatus === "loading" || profileStatus === "idle") {
  //     // nhẹ nhàng thôi, không cần duration dài
  //     // (dùng key để message sau đó có thể bị ghi đè)
  //   }

  //   if (!isApproved) {
  //     warning({
  //       title: "Hồ sơ giáo viên chưa được duyệt",
  //       icon: <ExclamationCircleFilled />,
  //       content:
  //         "Vui lòng cập nhật Teacher Profile và gửi admin duyệt. Chỉ khi hồ sơ ở trạng thái APPROVED thì bạn mới có thể tạo và đăng bán khóa học.",
  //       okText: "Đi tới Teacher Profile",
  //       onOk: () => navigate("/teacher/profile"),
  //     });
  //     return;
  //   }

  //   navigate("/teacher/create-course");
  // };

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
      {/* <div className={styles.header}>
        <div>
          <h1 className={styles.title}></h1>
          <p className={styles.subtitle}>
            Quản lý khóa học, theo dõi doanh thu và tương tác với học viên
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button type="primary" onClick={handleCreateCourse}>
            Tạo khóa học
          </Button>
        </div>
      </div> */}

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

        {/* ✅ NEW: Doanh thu tháng hiện tại */}
        <Col xs={24} sm={12} md={6}>
          <Card className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <DollarOutlined />
            </div>
            <Statistic
              title="Doanh thu tháng này"
              value={data.monthlyRevenue || 0}
              suffix="VNĐ"
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Courses */}
      <Card title="Những khóa học gần đây" className={styles.tableCard}>
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
