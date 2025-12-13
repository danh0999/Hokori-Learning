// TeacherRevenue.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Table,
  Tag,
  Modal,
  message,
  Space,
} from "antd";
import { DollarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../../configs/axios.js";
import styles from "./TeacherRevenue.module.scss";

const { Option } = Select;

const fmtVnd = (n) => Number(n || 0).toLocaleString("vi-VN");

export default function TeacherRevenue() {
  const [yearMonth, setYearMonth] = useState(dayjs().format("YYYY-MM"));
  const [loading, setLoading] = useState(false);

  const [payout, setPayout] = useState(null); // /payout-status
  const [summary, setSummary] = useState(null); // /summary
  const [paidFilter, setPaidFilter] = useState(null); // null | true | false
  const [courseFilter, setCourseFilter] = useState(null);

  const [openDetails, setOpenDetails] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRows, setDetailRows] = useState([]);
  const [detailCourse, setDetailCourse] = useState(null);

  const fetchPayout = async (ym) => {
    const res = await api.get("teacher/revenue/payout-status", {
      params: { yearMonth: ym },
    });
    setPayout(res?.data?.data || null);
  };

  const fetchSummary = async (ym, isPaid, courseId) => {
    const params = { yearMonth: ym };
    if (isPaid !== null) params.isPaid = isPaid;
    if (courseId) params.courseId = courseId;

    const res = await api.get("teacher/revenue/summary", { params });
    setSummary(res?.data?.data || null);
  };

  const reload = async (
    ym = yearMonth,
    isPaid = paidFilter,
    courseId = courseFilter
  ) => {
    try {
      setLoading(true);
      await Promise.all([fetchPayout(ym), fetchSummary(ym, isPaid, courseId)]);
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Không tải được dữ liệu doanh thu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const courses = useMemo(() => summary?.courses || [], [summary]);

  const courseOptions = useMemo(() => {
    // lấy từ summary (đã đủ để filter)
    return (summary?.courses || []).map((c) => ({
      courseId: c.courseId,
      courseTitle: c.courseTitle,
    }));
  }, [summary]);

  const onChangeMonth = (val) => {
    const ym = (val || dayjs()).format("YYYY-MM");
    setYearMonth(ym);
    // reset course filter vì course list theo tháng
    setCourseFilter(null);
    reload(ym, paidFilter, null);
  };

  const onChangePaid = (v) => {
    setPaidFilter(v);
    reload(yearMonth, v, courseFilter);
  };

  const onChangeCourse = (v) => {
    setCourseFilter(v);
    reload(yearMonth, paidFilter, v);
  };

  const openCourseDetails = async (course) => {
    try {
      setOpenDetails(true);
      setDetailCourse(course);
      setDetailLoading(true);
      const res = await api.get(
        `teacher/revenue/course/${course.courseId}/details`,
        {
          params: { yearMonth },
        }
      );
      setDetailRows(res?.data?.data || []);
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Không tải được chi tiết giao dịch."
      );
      setDetailRows([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: "Khóa học",
      dataIndex: "courseTitle",
      key: "courseTitle",
      render: (t) => <b>{t}</b>,
    },
    {
      title: "Giá khóa học",
      dataIndex: "coursePriceCents",
      key: "coursePriceCents",
      render: (v) => `${fmtVnd((v || 0) / 100)} VNĐ`,
    },
    {
      title: "Số giao dịch",
      dataIndex: "transactionCount",
      key: "transactionCount",
      align: "right",
    },
    {
      title: "Teacher nhận (80%)",
      dataIndex: "teacherRevenueCents",
      key: "teacherRevenueCents",
      render: (v) => `${fmtVnd((v || 0) / 100)} VNĐ`,
    },
    {
      title: "Trạng thái",
      dataIndex: "isPaid",
      key: "isPaid",
      render: (v) =>
        v ? (
          <Tag color="success">Đã trả</Tag>
        ) : (
          <Tag color="warning">Chưa trả</Tag>
        ),
    },
    {
      title: "Chi tiết",
      key: "action",
      render: (_, r) => (
        <a onClick={() => openCourseDetails(r)}>Xem giao dịch</a>
      ),
    },
  ];

  const detailColumns = [
    {
      title: "Payment ID",
      dataIndex: "paymentId",
      key: "paymentId",
      width: 110,
    },
    {
      title: "Enrollment ID",
      dataIndex: "enrollmentId",
      key: "enrollmentId",
      width: 120,
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmountCents",
      key: "totalAmountCents",
      render: (v) => `${fmtVnd((v || 0) / 100)} VNĐ`,
    },
    {
      title: "Teacher nhận",
      dataIndex: "teacherRevenueCents",
      key: "teacherRevenueCents",
      render: (v) => `${fmtVnd((v || 0) / 100)} VNĐ`,
    },
    {
      title: "Commission (admin)",
      dataIndex: "adminCommissionCents",
      key: "adminCommissionCents",
      render: (v) => `${fmtVnd((v || 0) / 100)} VNĐ`,
    },
    {
      title: "Trạng thái",
      dataIndex: "isPaid",
      key: "isPaid",
      render: (v) =>
        v ? (
          <Tag color="success">Đã trả</Tag>
        ) : (
          <Tag color="warning">Chưa trả</Tag>
        ),
    },
    {
      title: "Ghi chú payout",
      dataIndex: "payoutNote",
      key: "payoutNote",
      render: (v) => v || "—",
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Doanh thu giáo viên</h2>
          <p className={styles.subtitle}>
            Theo dõi doanh thu theo tháng, trạng thái đã trả/chưa trả và chi
            tiết giao dịch.
          </p>
        </div>

        <Space>
          <span className={styles.monthLabel}>Chọn tháng</span>
          <DatePicker
            picker="month"
            value={dayjs(yearMonth + "-01")}
            onChange={onChangeMonth}
            format="MM/YYYY"
            allowClear={false}
            className={styles.monthPicker}
          />

          <Select
            value={paidFilter}
            onChange={onChangePaid}
            style={{ width: 160 }}
            placeholder="Trạng thái"
            allowClear
          >
            <Option value={true}>Đã trả</Option>
            <Option value={false}>Chưa trả</Option>
          </Select>

          <Select
            value={courseFilter}
            onChange={onChangeCourse}
            style={{ width: 260 }}
            placeholder="Lọc theo khóa học"
            allowClear
          >
            {courseOptions.map((c) => (
              <Option key={c.courseId} value={c.courseId}>
                {c.courseTitle}
              </Option>
            ))}
          </Select>
        </Space>
      </div>

      <Row gutter={16} className={styles.summaryRow}>
        <Col xs={24} sm={12} md={8}>
          <Card loading={loading} className={styles.summaryCard}>
            <Statistic
              title={`Tổng doanh thu tháng ${yearMonth}`}
              value={fmtVnd((payout?.totalRevenueCents || 0) / 100)}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
            />
            <div className={styles.summaryHint}>
              Giao dịch: <b>{payout?.transactionCount ?? 0}</b>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card loading={loading} className={styles.summaryCard}>
            <Statistic
              title="Đã trả"
              value={fmtVnd((payout?.paidRevenueCents || 0) / 100)}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
            />
            <div className={styles.summaryHint}>
              Giao dịch đã trả: <b>{payout?.paidTransactionCount ?? 0}</b>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card loading={loading} className={styles.summaryCard}>
            <Statistic
              title="Chưa trả"
              value={fmtVnd((payout?.unpaidRevenueCents || 0) / 100)}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
            />
            <div className={styles.summaryHint}>
              Giao dịch chưa trả: <b>{payout?.unpaidTransactionCount ?? 0}</b>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        className={styles.tableCard}
        loading={loading}
        title={
          <div className={styles.tableHeader}>
            <div>
              <h3 className={styles.tableTitle}>Tổng hợp theo khóa học</h3>
              <p className={styles.tableSubtitle}>
                Danh sách các khóa học và tổng teacher nhận (80%) / trạng thái
                payout.
              </p>
            </div>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={courses}
          rowKey={(r) => r.courseId}
          pagination={false}
        />
      </Card>

      <Modal
        open={openDetails}
        title={
          detailCourse
            ? `Chi tiết giao dịch - ${detailCourse.courseTitle}`
            : "Chi tiết giao dịch"
        }
        onCancel={() => {
          setOpenDetails(false);
          setDetailRows([]);
          setDetailCourse(null);
        }}
        footer={null}
        width={980}
        destroyOnClose
      >
        <Table
          loading={detailLoading}
          columns={detailColumns}
          dataSource={detailRows}
          rowKey={(r) => r.id}
          pagination={{ pageSize: 10 }}
        />
      </Modal>
    </div>
  );
}
