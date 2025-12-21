// Revenue.jsx (Admin) - 2 Tabs: (1) Doanh thu (2) Payout GV
// Source: :contentReference[oaicite:1]{index=1}

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  DatePicker,
  Table,
  Tag,
  Modal,
  Descriptions,
  Input,
  Button,
  Space,
  Statistic,
  message,
  Tabs,
  Divider,
} from "antd";
import dayjs from "dayjs";
import api from "../../../configs/axios.js";
import s from "./Revenue.module.scss";

const fmtVnd = (n) => Number(n || 0).toLocaleString("vi-VN");
// ✅ mới – coi tất cả là VNĐ
const moneyFromCents = (v) => `${fmtVnd(v || 0)} VNĐ`;

const renderPayStatus = (status) => {
  if (!status) return <Tag>—</Tag>;
  const v = String(status).toUpperCase();
  if (v === "PAID") return <Tag color="green">PAID</Tag>;
  if (v === "PENDING") return <Tag color="gold">PENDING</Tag>;
  if (v === "CANCELLED") return <Tag color="red">CANCELLED</Tag>;
  if (v === "FAILED") return <Tag color="red">FAILED</Tag>;
  if (v === "EXPIRED") return <Tag color="orange">EXPIRED</Tag>;
  return <Tag>{v}</Tag>;
};

const renderPayoutStatus = (status) => {
  if (!status) return <Tag>—</Tag>;
  const v = String(status).toUpperCase();
  if (v === "PENDING") return <Tag color="gold">PENDING</Tag>;
  if (v === "PAID") return <Tag color="green">PAID</Tag>;
  if (v === "FAILED") return <Tag color="red">FAILED</Tag>;
  return <Tag>{v}</Tag>;
};

const isInMonth = (iso, yearMonth) => {
  if (!iso) return false;
  const m = dayjs(iso);
  return m.isValid() && m.format("YYYY-MM") === yearMonth;
};

export default function Revenue() {
  // shared month filter for both tabs
  const [yearMonth, setYearMonth] = useState(dayjs().format("YYYY-MM"));
  const [activeTab, setActiveTab] = useState("revenue"); // "revenue" | "payout"

  // ===================== TAB 1: REVENUE =====================
  const [revLoading, setRevLoading] = useState(false);

  // payments list (history) from /api/admin/payments
  const [paymentPage, setPaymentPage] = useState(0);
  const [paymentPageSize, setPaymentPageSize] = useState(20);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [paymentRows, setPaymentRows] = useState([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL"); // ALL/PAID/PENDING...
  const [activeRevenueView, setActiveRevenueView] = useState("PAY_ALL"); // PAY_ALL | PAY_AI | PAY_COURSE | COURSE_GROSS

  // revenue total from /api/admin/revenue/total?period=YYYY-MM
  const [courseGross, setCourseGross] = useState(null); // { revenueCents, transactionCount, ... , transactions[] }

  const fetchPayments = async (ym, page = 0, pageSize = 20, status = "ALL") => {
    const res = await api.get("admin/payments", {
      params: {
        currentPage: page,
        pageSize,
        filterStatus: status, // theo response bạn: filterStatus
        // Nếu BE có yearMonth/period thì bạn có thể thêm ở đây.
        // yearMonth: ym,
      },
    });
    const data = res?.data?.data;
    setPaymentRows(Array.isArray(data?.payments) ? data.payments : []);
    setPaymentTotal(Number(data?.totalElements || 0));
    setPaymentPage(Number(data?.currentPage || 0));
    setPaymentPageSize(Number(data?.pageSize || pageSize));
  };

  const fetchCourseGross = async (ym) => {
    // theo response bạn: data.period = "2025-12"
    // mình dùng param period, nếu BE dùng yearMonth thì đổi lại: { yearMonth: ym }
    const res = await api.get("admin/revenue/total", {
      params: { period: ym },
    });
    setCourseGross(res?.data?.data || null);
  };

  const reloadRevenueTab = async (ym = yearMonth) => {
    try {
      setRevLoading(true);
      await Promise.all([
        fetchPayments(ym, 0, paymentPageSize, paymentStatusFilter),
        fetchCourseGross(ym),
      ]);
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Không tải được dữ liệu doanh thu."
      );
    } finally {
      setRevLoading(false);
    }
  };

  // compute summary from currently loaded paymentRows (client-side filter by month)
  const paymentRowsInMonth = useMemo(() => {
    return (paymentRows || []).filter((p) =>
      isInMonth(p?.createdAt, yearMonth)
    );
  }, [paymentRows, yearMonth]);

  const paidPaymentsInMonth = useMemo(() => {
    return paymentRowsInMonth.filter(
      (p) => String(p?.status).toUpperCase() === "PAID"
    );
  }, [paymentRowsInMonth]);

  const paidAiCents = useMemo(() => {
    return paidPaymentsInMonth
      .filter((p) => p?.aiPackageId != null)
      .reduce((sum, p) => sum + Number(p?.amountCents || 0), 0);
  }, [paidPaymentsInMonth]);

  const paidCourseCentsViaPayments = useMemo(() => {
    return paidPaymentsInMonth
      .filter((p) => Array.isArray(p?.courseIds) && p.courseIds.length > 0)
      .reduce((sum, p) => sum + Number(p?.amountCents || 0), 0);
  }, [paidPaymentsInMonth]);

  const courseGrossCents = courseGross?.revenueCents ?? 0;

  const paymentCols = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 190,
      render: (v) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : "—"),
    },
    {
      title: "Loại",
      key: "type",
      width: 120,
      render: (_, r) => {
        const isAI = r?.aiPackageId != null;
        const isCourse = Array.isArray(r?.courseIds) && r.courseIds.length > 0;
        if (isAI) return <Tag color="blue">AI Package</Tag>;
        if (isCourse) return <Tag color="purple">Course</Tag>;
        return <Tag>Other</Tag>;
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Số tiền",
      dataIndex: "amountCents",
      key: "amountCents",
      align: "right",
      width: 140,
      render: (v) => moneyFromCents(v),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (v) => renderPayStatus(v),
    },
    {
      title: "OrderCode",
      dataIndex: "orderCode",
      key: "orderCode",
      width: 160,
    },
  ];

  const courseGrossCols = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 190,
      render: (v) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : "—"),
    },
    {
      title: "Teacher",
      dataIndex: "teacherName",
      key: "teacherName",
      width: 160,
    },
    {
      title: "Khóa học",
      dataIndex: "courseTitle",
      key: "courseTitle",
      ellipsis: true,
    },
    {
      title: "Số tiền",
      dataIndex: "amountCents",
      key: "amountCents",
      align: "right",
      width: 140,
      render: (v) => moneyFromCents(v),
    },
  ];

  const revenueTableTitle = useMemo(() => {
    if (activeRevenueView === "PAY_AI") return "Lịch sử giao dịch - Gói AI";
    if (activeRevenueView === "PAY_COURSE")
      return "Lịch sử giao dịch - Khóa học";
    if (activeRevenueView === "COURSE_GROSS")
      return "Doanh thu khóa học (gross) - Transactions";
    return "Lịch sử giao dịch - Tất cả";
  }, [activeRevenueView]);

  const revenueTableData = useMemo(() => {
    if (activeRevenueView === "COURSE_GROSS")
      return courseGross?.transactions || [];
    if (activeRevenueView === "PAY_AI")
      return paymentRowsInMonth.filter((p) => p?.aiPackageId != null);
    if (activeRevenueView === "PAY_COURSE")
      return paymentRowsInMonth.filter(
        (p) => Array.isArray(p?.courseIds) && p.courseIds.length > 0
      );
    return paymentRowsInMonth;
  }, [activeRevenueView, courseGross, paymentRowsInMonth]);

  const revenueTableCols = useMemo(() => {
    return activeRevenueView === "COURSE_GROSS" ? courseGrossCols : paymentCols;
  }, [activeRevenueView]);

  // ===================== TAB 2: PAYOUT =====================
  const [payoutLoading, setPayoutLoading] = useState(false);

  const [commissionCents, setCommissionCents] = useState(0);
  const [rows, setRows] = useState([]);

  // detail modal
  const [openDetail, setOpenDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  // mark paid modal
  const [openPaid, setOpenPaid] = useState(false);
  const [paying, setPaying] = useState(false);
  const [note, setNote] = useState("");
  const [target, setTarget] = useState(null); // { teacherId, teacherName, yearMonth }

  const fetchCommission = async (ym) => {
    const res = await api.get("admin/payments/admin-commission", {
      params: { yearMonth: ym },
    });
    setCommissionCents(res?.data?.data ?? 0);
  };

  const fetchPending = async (ym) => {
    const res = await api.get("admin/payments/pending-payouts", {
      params: { yearMonth: ym },
    });
    setRows(Array.isArray(res?.data?.data) ? res.data.data : []);
  };

  const reloadPayoutTab = async (ym = yearMonth) => {
    try {
      setPayoutLoading(true);
      await Promise.all([fetchCommission(ym), fetchPending(ym)]);
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Không tải được dữ liệu payout."
      );
    } finally {
      setPayoutLoading(false);
    }
  };

  const openTeacherDetail = async (r) => {
    try {
      setOpenDetail(true);
      setDetail(null);
      setDetailLoading(true);

      const res = await api.get(
        `admin/payments/teacher/${r.teacherId}/pending-details`,
        {
          params: { yearMonth },
        }
      );
      setDetail(res?.data?.data || null);
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Không tải được chi tiết teacher."
      );
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openMarkPaid = (r) => {
    setTarget({
      teacherId: r.teacherId,
      teacherName: r.teacherName,
      yearMonth,
    });
    setNote("");
    setOpenPaid(true);
  };

  const submitMarkPaid = async () => {
    if (!target?.teacherId) return;
    try {
      setPaying(true);
      await api.post("admin/payments/mark-paid", {
        teacherId: target.teacherId,
        yearMonth: target.yearMonth,
        note: note?.trim() || null,
      });
      message.success("Đã đánh dấu đã chuyển tiền.");
      setOpenPaid(false);
      setTarget(null);
      await reloadPayoutTab(yearMonth);
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "Mark-paid thất bại.");
    } finally {
      setPaying(false);
    }
  };

  const payoutColumns = [
    {
      title: "Teacher",
      dataIndex: "teacherName",
      key: "teacherName",
      render: (t) => <b>{t}</b>,
    },
    { title: "Email", dataIndex: "teacherEmail", key: "teacherEmail" },
    {
      title: "Tháng",
      dataIndex: "yearMonth",
      key: "yearMonth",
      render: (v) => <Tag>{v}</Tag>,
      width: 110,
    },
    {
      title: "Cần chuyển",
      dataIndex: "totalPendingRevenueCents",
      key: "totalPendingRevenueCents",
      render: (v) => moneyFromCents(v),
      align: "right",
    },
    {
      title: "Số khóa",
      dataIndex: "totalPendingSales",
      key: "totalPendingSales",
      align: "right",
      width: 90,
    },
    {
      title: "Trạng thái",
      dataIndex: "payoutStatus",
      key: "payoutStatus",
      width: 140,
      render: (v) => renderPayoutStatus(v),
    },
    {
      title: "Hành động",
      key: "action",
      width: 240,
      render: (_, r) => (
        <Space>
          <Button onClick={() => openTeacherDetail(r)}>Xem chi tiết</Button>
          <Button type="primary" onClick={() => openMarkPaid(r)}>
            Đã chuyển tiền
          </Button>
        </Space>
      ),
    },
  ];

  const detailCourses = useMemo(() => detail?.courses || [], [detail]);

  // ✅ Modal table theo yêu cầu mới:
  // tên khóa học, số giao dịch, tiền admin(20%), tiền teacher (80%), tiền gốc khóa học (coursePrice)
  // NOTE: coursePrice cần BE trả về (vd: coursePriceCents / coursePrice). Nếu chưa có -> "—"
  const payoutDetailCourseCols = [
    {
      title: "Khóa học",
      dataIndex: "courseTitle",
      key: "courseTitle",
      render: (t) => <b>{t}</b>,
    },
    {
      title: "Số giao dịch",
      dataIndex: "salesCount",
      key: "salesCount",
      align: "right",
      width: 120,
    },
    {
      title: "Tiền admin (20%)",
      key: "admin20",
      align: "right",
      width: 160,
      render: (_, r) => {
        const rev = Number(r?.revenueCents || 0);
        return moneyFromCents(Math.round(rev * 0.2));
      },
    },
    {
      title: "Tiền teacher (80%)",
      key: "teacher80",
      align: "right",
      width: 170,
      render: (_, r) => {
        const rev = Number(r?.revenueCents || 0);
        return moneyFromCents(Math.round(rev * 0.8));
      },
    },
    {
      title: "Tiền gốc khóa học",
      key: "coursePrice",
      align: "right",
      width: 170,
      render: (_, r) => {
        // Bạn đổi field này theo BE nếu khác:
        // coursePriceCents hoặc coursePrice (đã là cents)
        const priceCents =
          r?.coursePriceCents ??
          r?.coursePriceCentsAmount ??
          r?.coursePrice ??
          null;

        if (priceCents == null) return "—";
        return moneyFromCents(Number(priceCents));
      },
    },
  ];

  // ===================== SHARED EFFECTS =====================
  useEffect(() => {
    // initial load for both tabs
    reloadRevenueTab(yearMonth);
    reloadPayoutTab(yearMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeMonth = (v) => {
    const ym = (v || dayjs()).format("YYYY-MM");
    setYearMonth(ym);

    // reload both
    reloadRevenueTab(ym);
    reloadPayoutTab(ym);
  };

  // ===================== RENDER =====================
  return (
    <div className={s.page}>
      <div className={s.titleRow}>
        <h1 className={s.title}>Tài chính</h1>

        <Space>
          <span>Chọn tháng</span>
          <DatePicker
            picker="month"
            value={dayjs(yearMonth + "-01")}
            onChange={onChangeMonth}
            format="MM/YYYY"
            allowClear={false}
          />
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "revenue",
            label: "Doanh thu",
            children: (
              <>
                <div className={s.summaryGrid}>
                  <Card
                    className={s.summaryCard}
                    loading={revLoading}
                    hoverable
                    onClick={() => setActiveRevenueView("PAY_AI")}
                  >
                    <Statistic
                      title={`Doanh thu gói AI (PAID) - ${yearMonth}`}
                      value={fmtVnd(paidAiCents)}
                      suffix="VNĐ"
                    />
                    <div className={s.summaryHint}>
                      Bấm để xem lịch sử giao dịch gói AI.
                    </div>
                  </Card>

                  <Card
                    className={s.summaryCard}
                    loading={revLoading}
                    hoverable
                    onClick={() => setActiveRevenueView("PAY_COURSE")}
                  >
                    <Statistic
                      title={`Doanh thu khóa học (PAID) - ${yearMonth} (từ Payments)`}
                      value={fmtVnd(paidCourseCentsViaPayments)}
                      suffix="VNĐ"
                    />
                    <div className={s.summaryHint}>
                      Bấm để xem lịch sử giao dịch khóa học (Payments).
                    </div>
                  </Card>

                  <Card
                    className={s.summaryCard}
                    loading={revLoading}
                    hoverable
                    onClick={() => setActiveRevenueView("COURSE_GROSS")}
                  >
                    <Statistic
                      title={`Doanh thu khóa học (gross) - ${yearMonth}`}
                      value={fmtVnd(courseGrossCents)}
                      suffix="VNĐ"
                    />
                    <div className={s.summaryHint}>
                      Lấy từ /admin/revenue/total (chưa tính hoa hồng). Bấm để
                      xem transactions.
                    </div>
                  </Card>
                </div>

                <Divider style={{ margin: "12px 0" }} />

                <Card className={s.tableWrap} title={revenueTableTitle}>
                  <Table
                    loading={revLoading}
                    columns={revenueTableCols}
                    dataSource={revenueTableData}
                    rowKey={(r) =>
                      activeRevenueView === "COURSE_GROSS"
                        ? `rev-${r.id}`
                        : `pay-${r.id}`
                    }
                    pagination={
                      activeRevenueView === "COURSE_GROSS"
                        ? { pageSize: 10 }
                        : {
                            current: paymentPage + 1,
                            pageSize: paymentPageSize,
                            total: paymentTotal,
                            showSizeChanger: true,
                            onChange: async (page, pageSize) => {
                              try {
                                setRevLoading(true);
                                await fetchPayments(
                                  yearMonth,
                                  page - 1,
                                  pageSize,
                                  paymentStatusFilter
                                );
                              } catch (e) {
                                console.error(e);
                                message.error("Không đổi trang payments được.");
                              } finally {
                                setRevLoading(false);
                              }
                            },
                          }
                    }
                  />
                </Card>
              </>
            ),
          },
          {
            key: "payout",
            label: "Payout giáo viên",
            children: (
              <>
                <div className={s.summaryGrid}>
                  <Card className={s.summaryCard} loading={payoutLoading}>
                    <Statistic
                      title={`Admin commission (${yearMonth})`}
                      value={fmtVnd(commissionCents || 0)}
                      suffix="VNĐ"
                    />
                    <div className={s.summaryHint}>
                      Commission = 20% doanh thu hệ thống.
                    </div>
                  </Card>

                  <Card className={s.summaryCard} loading={payoutLoading}>
                    <Statistic
                      title={`Teacher cần payout (${yearMonth})`}
                      value={rows.length}
                    />
                    <div className={s.summaryHint}>
                      Danh sách teachers có revenue chưa trả.
                    </div>
                  </Card>
                </div>

                <Card className={s.tableWrap}>
                  <Table
                    loading={payoutLoading}
                    columns={payoutColumns}
                    dataSource={rows}
                    rowKey={(r) => `${r.teacherId}-${r.yearMonth}`}
                    pagination={{ pageSize: 10 }}
                  />
                </Card>

                <Modal
                  open={openDetail}
                  onCancel={() => {
                    setOpenDetail(false);
                    setDetail(null);
                  }}
                  footer={null}
                  width={1050}
                  destroyOnClose
                  title={
                    detail
                      ? `Chi tiết payout - ${detail.teacherName}`
                      : "Chi tiết payout"
                  }
                >
                  <Card loading={detailLoading}>
                    {detail && (
                      <>
                        <Descriptions bordered size="small" column={2}>
                          <Descriptions.Item label="Teacher">
                            {detail.teacherName}
                          </Descriptions.Item>
                          <Descriptions.Item label="Email">
                            {detail.teacherEmail}
                          </Descriptions.Item>
                          <Descriptions.Item label="Tháng">
                            {detail.yearMonth}
                          </Descriptions.Item>
                          <Descriptions.Item label="Tổng chưa trả">
                            {moneyFromCents(
                              detail.totalPendingRevenueCents || 0
                            )}
                          </Descriptions.Item>
                          <Descriptions.Item label="Ngân hàng">
                            {detail.bankName || "—"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Số TK">
                            {detail.bankAccountNumber || "—"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Chủ TK">
                            {detail.bankAccountName || "—"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Chi nhánh">
                            {detail.bankBranchName || "—"}
                          </Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 16 }}>
                          <h3 style={{ marginBottom: 8 }}>Theo khóa học</h3>
                          <Table
                            columns={payoutDetailCourseCols}
                            dataSource={detailCourses}
                            rowKey={(r) => r.courseId}
                            pagination={false}
                          />
                        </div>
                      </>
                    )}
                  </Card>
                </Modal>

                <Modal
                  open={openPaid}
                  onCancel={() => {
                    setOpenPaid(false);
                    setTarget(null);
                    setNote("");
                  }}
                  title={
                    target
                      ? `Đánh dấu đã chuyển tiền - ${target.teacherName}`
                      : "Đánh dấu đã chuyển tiền"
                  }
                  okText="Xác nhận"
                  cancelText="Hủy"
                  confirmLoading={paying}
                  onOk={submitMarkPaid}
                  destroyOnClose
                >
                  <p>
                    Tháng: <b>{target?.yearMonth}</b>
                  </p>
                  <Input.TextArea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú (vd: Đã chuyển khoản ngày ...)"
                  />
                </Modal>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
