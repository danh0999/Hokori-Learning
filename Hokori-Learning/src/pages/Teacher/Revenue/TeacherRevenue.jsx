// TeacherRevenue.jsx
// Source: :contentReference[oaicite:1]{index=1}
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
const money = (v) => `${fmtVnd(v || 0)} VNĐ`; // ✅ KHÔNG chia 100

function renderPayoutStatusTag(payoutStatus) {
  const s = String(payoutStatus || "").toUpperCase();
  if (s === "FULLY_PAID") return <Tag color="success">Đã thanh toán hết</Tag>;
  if (s === "PARTIALLY_PAID")
    return <Tag color="warning">Đã thanh toán một nửa</Tag>;
  // PENDING / null / ...
  return <Tag color="default">Chưa thanh toán</Tag>;
}

/**
 * API summary hiện chưa trả "coursePriceCents".
 * Mình ước tính "giá gốc" trung bình:
 * - revenueCents là "tiền đã chia hoa hồng" (teacher share 80%)
 * - grossTotal ≈ revenueCents / 0.8
 * - avgPrice ≈ grossTotal / salesCount
 */
function estimateCoursePriceVnd(course) {
  const sales = Number(course?.salesCount || 0);
  const teacherShareTotal = Number(course?.revenueCents || 0);
  if (!sales || !teacherShareTotal) return null;

  const grossTotal = teacherShareTotal / 0.8; // tổng tiền khách trả cho khóa (ước tính)
  const avgPrice = grossTotal / sales;

  // làm tròn vì tiền VNĐ
  return Math.round(avgPrice);
}

export default function TeacherRevenue() {
  const [yearMonth, setYearMonth] = useState(dayjs().format("YYYY-MM"));
  const [loading, setLoading] = useState(false);

  const [payout, setPayout] = useState(null); // /payout-status
  const [summary, setSummary] = useState(null); // /summary

  // filter UI
  const [payoutStatusFilter, setPayoutStatusFilter] = useState(null); // null | "UNPAID" | "PARTIALLY_PAID" | "FULLY_PAID"
  const [courseFilter, setCourseFilter] = useState(null);

  // detail modal
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

  const fetchSummary = async (ym, courseId) => {
    const params = { yearMonth: ym };
    if (courseId) params.courseId = courseId;

    const res = await api.get("teacher/revenue/summary", { params });
    setSummary(res?.data?.data || null);
  };

  const reload = async (ym = yearMonth, courseId = courseFilter) => {
    try {
      setLoading(true);
      await Promise.all([fetchPayout(ym), fetchSummary(ym, courseId)]);
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

  const courseOptions = useMemo(() => {
    return (summary?.courses || []).map((c) => ({
      courseId: c.courseId,
      courseTitle: c.courseTitle,
    }));
  }, [summary]);

  // courses sau filter client-side theo payoutStatus
  const courses = useMemo(() => {
    const list = summary?.courses || [];
    if (!payoutStatusFilter) return list;

    if (payoutStatusFilter === "UNPAID") {
      return list.filter(
        (c) =>
          !c?.payoutStatus || String(c.payoutStatus).toUpperCase() === "PENDING"
      );
    }

    return list.filter(
      (c) => String(c?.payoutStatus || "").toUpperCase() === payoutStatusFilter
    );
  }, [summary, payoutStatusFilter]);

  const onChangeMonth = (val) => {
    const ym = (val || dayjs()).format("YYYY-MM");
    setYearMonth(ym);
    setCourseFilter(null);
    reload(ym, null);
  };

  const onChangeCourse = (v) => {
    setCourseFilter(v);
    reload(yearMonth, v);
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

  // ====== MAIN TABLE (theo yêu cầu mới) ======
  const columns = [
    {
      title: "Khóa học",
      dataIndex: "courseTitle",
      key: "courseTitle",
      fixed: "left", // 👈 cố định
      width: 220,
      render: (t) => <b>{t}</b>,
    },
    {
      title: "Giá gốc",
      key: "coursePrice",
      align: "right",
      width: 140,
      render: (_, r) => {
        const v = estimateCoursePriceVnd(r);
        return v == null ? "—" : money(v);
      },
    },
    {
      title: "Số lượng mua",
      dataIndex: "salesCount",
      width: 130,
      align: "center",
    },
    {
      title: "Tổng tiền đã chia hoa hồng",
      dataIndex: "revenueCents",
      width: 220,
      align: "right",
      render: money,
    },
    {
      title: "Đã thanh toán cho teacher",
      dataIndex: "paidRevenueCents",
      width: 230,
      align: "right",
      render: money,
    },
    {
      title: "Chưa thanh toán",
      dataIndex: "unpaidRevenueCents",
      width: 210,
      align: "right",
      render: money,
    },
    {
      title: "Trạng thái",
      dataIndex: "payoutStatus",
      width: 170,
      align: "center",
      render: renderPayoutStatusTag,
    },
    {
      title: "Chi tiết",
      key: "action",
      fixed: "right", // 👈 cố định
      width: 120,
      align: "center",
      render: (_, r) => <a onClick={() => openCourseDetails(r)}>Xem</a>,
    },
  ];

  // ====== DETAIL MODAL TABLE (đổi tên cột) ======
  const detailColumns = [
    {
      title: "STT",
      key: "index",
      width: 70,
      align: "center",
      render: (_v, _r, index) => index + 1,
    },
    {
      title: "Tổng tiền (khách trả)",
      dataIndex: "totalAmountCents",
      key: "totalAmountCents",
      align: "right",
      render: (v) => money(v),
      width: 180,
    },
    {
      title: "Số tiền đã chia hoa hồng",
      dataIndex: "teacherRevenueCents",
      key: "teacherRevenueCents",
      align: "right",
      render: (v) => money(v),
      width: 220,
    },
    {
      title: "Tiền hoa hồng",
      dataIndex: "adminCommissionCents",
      key: "adminCommissionCents",
      align: "right",
      render: (v) => money(v),
      width: 160,
    },
    {
      title: "Trạng thái",
      dataIndex: "isPaid",
      key: "isPaid",
      width: 130,
      render: (v) =>
        v ? (
          <Tag color="success">Đã chuyển</Tag>
        ) : (
          <Tag color="warning">Chưa chuyển</Tag>
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
            Theo dõi doanh thu theo tháng, trạng thái đã chuyển/chưa chuyển và
            chi tiết giao dịch.
          </p>
        </div>

        <Space wrap>
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
            value={payoutStatusFilter}
            onChange={(v) => setPayoutStatusFilter(v)}
            style={{ width: 220 }}
            placeholder="Trạng thái payout"
            allowClear
          >
            <Option value="UNPAID">Chưa thanh toán</Option>
            <Option value="PARTIALLY_PAID">Đã thanh toán một nửa</Option>
            <Option value="FULLY_PAID">Đã thanh toán hết</Option>
          </Select>

          <Select
            value={courseFilter}
            onChange={onChangeCourse}
            style={{ width: 300 }}
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
              title={`Tổng doanh thu dự kiến ${yearMonth}`}
              value={fmtVnd(payout?.totalRevenueCents || 0)}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card loading={loading} className={styles.summaryCard}>
            <Statistic
              title="Đã trả"
              value={fmtVnd(payout?.paidRevenueCents || 0)}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card loading={loading} className={styles.summaryCard}>
            <Statistic
              title="Chưa trả"
              value={fmtVnd(payout?.unpaidRevenueCents || 0)}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
            />
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
                Hiển thị số lượng mua, số lượt đã được admin chuyển, và số tiền
                đã/ chưa thanh toán.
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
          size="middle"
          scroll={{ x: 1600 }}
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
        width={1050}
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
