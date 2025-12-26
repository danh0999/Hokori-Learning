// Revenue.jsx (Admin) - 2 tabs: Doanh thu + Payout giáo viên
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
  Tabs,
  message,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import api from "../../../configs/axios.js";
import s from "./Revenue.module.scss";

const fmtVnd = (n) => Number(n || 0).toLocaleString("vi-VN");
const money = (v) => `${fmtVnd(v || 0)} VNĐ`; // ✅ KHÔNG chia 100

const renderPayoutStatus = (status) => {
  const v = String(status || "").toUpperCase();
  if (!v) return <Tag>—</Tag>;
  if (v === "PENDING") return <Tag color="gold">Chưa chuyển</Tag>;
  if (v === "PAID") return <Tag color="green">Đã chuyển</Tag>;
  if (v === "FAILED") return <Tag color="red">Lỗi</Tag>;
  return <Tag>{v}</Tag>;
};

export default function Revenue() {
  const [activeTab, setActiveTab] = useState("revenue");
  const [yearMonth, setYearMonth] = useState(dayjs().format("YYYY-MM"));

  // ===================== TAB 1: DOANH THU (GIỮ CƠ BẢN, BẠN TINH CHỈNH SAU) =====================
  const [revLoading, setRevLoading] = useState(false);
  const [activeRevenueView, setActiveRevenueView] = useState("PAYMENTS"); // PAYMENTS | COURSE_TOTAL

  const [paymentsRes, setPaymentsRes] = useState({
    totalPaidCents: 0,
    payments: [],
    totalPages: 0,
    pageSize: 20,
    currentPage: 0,
    totalElements: 0,
    filterStatus: "ALL",
  });

  const [courseTotal, setCourseTotal] = useState({
    period: "",
    revenueCents: 0,
    transactionCount: 0,
    teacherCount: 0,
    courseCount: 0,
    transactions: [],
  });

  const fetchPayments = async ({
    page = 0,
    pageSize = 20,
    filterStatus = "ALL",
  } = {}) => {
    // Tab 1 bạn muốn giữ nguyên thì sau bạn chỉnh params theo BE.
    const res = await api.get("admin/payments", {
      params: { page, pageSize, filterStatus },
    });
    setPaymentsRes(res?.data?.data || {});
  };

  const fetchCourseTotal = async (ym) => {
    const res = await api.get("admin/revenue/total", {
      params: { yearMonth: ym },
    });
    setCourseTotal(res?.data?.data || {});
  };

  const reloadRevenueTab = async (ym = yearMonth) => {
    try {
      setRevLoading(true);
      await Promise.all([
        fetchPayments({ page: 0, pageSize: 20, filterStatus: "ALL" }),
        fetchCourseTotal(ym),
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

  // Payments table (tab 1)
  const paymentColumns = [
    { title: "Mã", dataIndex: "id", key: "id", width: 90, fixed: "left" },
    {
      title: "OrderCode",
      dataIndex: "orderCode",
      key: "orderCode",
      width: 160,
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (t) => (
        <Tooltip title={t}>
          <span>{t}</span>
        </Tooltip>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amountCents",
      key: "amountCents",
      width: 160,
      align: "right",
      render: (v) => money(v),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (v) => {
        const s = String(v || "").toUpperCase();
        if (s === "PAID") return <Tag color="green">PAID</Tag>;
        if (s === "PENDING") return <Tag color="gold">PENDING</Tag>;
        if (s === "CANCELLED") return <Tag>Cancelled</Tag>;
        if (s === "FAILED") return <Tag color="red">Failed</Tag>;
        return <Tag>{s}</Tag>;
      },
    },
    {
      title: "Tạo lúc",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 190,
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
    },
  ];

  // Course total table (tab 1)
  const courseTxColumns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80, fixed: "left" },
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
      render: (t) => (
        <Tooltip title={t}>
          <b>{t}</b>
        </Tooltip>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amountCents",
      key: "amountCents",
      width: 150,
      align: "right",
      render: (v) => money(v),
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 190,
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
    },
  ];

  // ===================== TAB 2: PAYOUT GIÁO VIÊN (THEO BE GUIDE) =====================
  const [payoutLoading, setPayoutLoading] = useState(false);

  // commission details (đúng guide)
  const [commission, setCommission] = useState({
    yearMonth: "",
    expectedRevenueCents: 0,
    paidRevenueCents: 0,
    totalRevenueCents: 0,
  });

  // pending teachers
  const [rows, setRows] = useState([]);

  // detail modal
  const [openDetail, setOpenDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  // mark paid modal
  const [openPaid, setOpenPaid] = useState(false);
  const [paying, setPaying] = useState(false);
  const [note, setNote] = useState("");
  const [target, setTarget] = useState(null);

  // history modal
  const [openHistory, setOpenHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [payoutView, setPayoutView] = useState("PENDING"); // PENDING | HISTORY

  const fetchCommissionDetails = async (ym) => {
    const res = await api.get("admin/payments/admin-commission-details", {
      params: { yearMonth: ym },
    });
    setCommission(res?.data?.data || {});
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
      await Promise.all([fetchCommissionDetails(ym), fetchPending(ym)]);
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Không tải được dữ liệu payout."
      );
    } finally {
      setPayoutLoading(false);
    }
  };
  const loadHistory = async (ym = yearMonth) => {
    try {
      setHistoryLoading(true);
      const all = await fetchPayoutHistory(ym);
      setHistoryRows(all);
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Không tải được lịch sử payout."
      );
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
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

  const fetchPayoutHistory = async (ym) => {
    const res = await api.get("admin/payments/payout-history", {
      params: { yearMonth: ym },
    });
    return Array.isArray(res?.data?.data) ? res.data.data : [];
  };

  const openTeacherHistory = async (r) => {
    try {
      setHistoryTeacher({
        teacherId: r.teacherId,
        teacherName: r.teacherName,
        teacherEmail: r.teacherEmail,
      });
      setOpenHistory(true);
      setHistoryRows([]);
      setHistoryLoading(true);

      const all = await fetchPayoutHistory(yearMonth);
      const filtered = all.filter(
        (x) => Number(x.teacherId) === Number(r.teacherId)
      );
      setHistoryRows(filtered);
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Không tải được lịch sử payout."
      );
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const pendingTeachers = rows.length;

  const pendingAmount = useMemo(
    () =>
      rows.reduce(
        (sum, r) => sum + Number(r?.totalPendingRevenueCents || 0),
        0
      ),
    [rows]
  );
  const pendingCourses = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r?.courseCount || 0), 0),
    [rows]
  );
  const pendingSales = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r?.totalPendingSales || 0), 0),
    [rows]
  );

  // Outer table (tab2) đúng field guide
  const payoutColumns = [
    {
      title: "Teacher",
      dataIndex: "teacherName",
      key: "teacherName",
      render: (t) => <b>{t}</b>,
      width: 180,
      fixed: "left",
    },
    {
      title: "Email",
      dataIndex: "teacherEmail",
      key: "teacherEmail",
      width: 240,
    },
    {
      title: "Tháng",
      dataIndex: "yearMonth",
      key: "yearMonth",
      width: 110,
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: "Cần chuyển",
      dataIndex: "totalPendingRevenueCents",
      key: "totalPendingRevenueCents",
      width: 160,
      align: "right",
      render: (v) => money(v),
    },
    {
      title: "Số khóa",
      dataIndex: "courseCount",
      key: "courseCount",
      width: 95,
      align: "center",
    },
    {
      title: "Số GD",
      dataIndex: "totalPendingSales",
      key: "totalPendingSales",
      width: 95,
      align: "center",
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
      width: 260,
      fixed: "right",
      render: (_, r) => (
        <Space>
          <Button onClick={() => openTeacherDetail(r)}>Xem chi tiết</Button>
          <Button type="primary" onClick={() => openMarkPaid(r)}>
            Chuyển tiền
          </Button>
        </Space>
      ),
    },
  ];

  const detailCourses = useMemo(() => detail?.courses || [], [detail]);

  // Modal course table (tab2) theo guide: courseTitle, salesCount, adminCommissionCents, revenueCents, originalCoursePriceCents
  const payoutDetailCourseCols = [
    {
      title: "Khóa học",
      dataIndex: "courseTitle",
      key: "courseTitle",
      width: 340,
      fixed: "left",
      ellipsis: { showTitle: false },
      className: s.courseCol,
      render: (t) => (
        <Tooltip title={t} placement="topLeft">
          <div className={s.courseTitleCell}>
            <b className={s.courseTitleText}>{t || "—"}</b>
          </div>
        </Tooltip>
      ),
    },

    // ✅ NEW: Giá gốc 1 khóa (courseBasePriceCents)
    {
      title: "Giá gốc (1 khóa)",
      dataIndex: "courseBasePriceCents",
      key: "courseBasePriceCents",
      width: 160,
      align: "right",
      render: (v) => (v == null ? "—" : money(v)),
    },

    {
      title: "Số giao dịch",
      dataIndex: "salesCount",
      key: "salesCount",
      width: 120,
      align: "center",
    },

    // ✅ NEW: Tổng tiền gốc (giá gốc * số GD) (totalPaidAmountCents)
    {
      title: "Tổng tiền gốc",
      dataIndex: "totalPaidAmountCents",
      key: "totalPaidAmountCents",
      width: 160,
      align: "right",
      render: (v, row) => {
        // nếu BE không trả field này thì fallback tự tính
        const base = Number(row?.courseBasePriceCents || 0);
        const cnt = Number(row?.salesCount || 0);
        const computed = base * cnt;
        const val = v == null ? computed : v;
        return money(val);
      },
    },

    {
      title: "Tiền hoa hồng (Admin 20%)",
      dataIndex: "adminCommissionCents",
      key: "adminCommissionCents",
      width: 190,
      align: "right",
      render: (v) => money(v),
    },

    {
      title: "Số tiền đã chia hoa hồng (Teacher 80%)",
      dataIndex: "revenueCents",
      key: "revenueCents",
      width: 230,
      align: "right",
      render: (v) => money(v),
    },
  ];
  const payoutHistoryCols = [
    {
      title: "Ngày chuyển",
      dataIndex: "payoutDate",
      key: "payoutDate",
      width: 180,
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
    },
    {
      title: "Teacher",
      dataIndex: "teacherName",
      key: "teacherName",
      width: 180,
      render: (t) => <b>{t}</b>,
    },
    {
      title: "Email",
      dataIndex: "teacherEmail",
      key: "teacherEmail",
      width: 240,
    },
    {
      title: "Số GD",
      dataIndex: "totalSales",
      key: "totalSales",
      width: 90,
      align: "center",
    },
    {
      title: "Hoa hồng Admin (20%)",
      dataIndex: "totalAdminCommissionCents",
      key: "totalAdminCommissionCents",
      width: 200,
      align: "right",
      render: (v) => money(v),
    },
    {
      title: "Teacher nhận (80%)",
      dataIndex: "totalPaidRevenueCents",
      key: "totalPaidRevenueCents",
      width: 180,
      align: "right",
      render: (v) => money(v),
    },

    {
      title: "Người chuyển",
      dataIndex: "payoutByUserName",
      key: "payoutByUserName",
      width: 160,
      render: (t) => t || "—",
    },
    {
      title: "Ghi chú",
      dataIndex: "payoutNote",
      key: "payoutNote",
      ellipsis: true,
      render: (t) =>
        t ? (
          <Tooltip title={t}>
            <span>{t}</span>
          </Tooltip>
        ) : (
          "—"
        ),
    },
  ];

  const payoutHistoryCourseCols = [
    {
      title: "Khóa học",
      dataIndex: "courseTitle",
      key: "courseTitle",
      render: (t) => <b>{t}</b>,
    },
    {
      title: "Giá gốc (1 khóa)",
      dataIndex: "courseBasePriceCents",
      key: "courseBasePriceCents",
      width: 160,
      align: "right",
      render: (v) => (v == null ? "—" : money(v)),
    },
    {
      title: "Số GD",
      dataIndex: "salesCount",
      key: "salesCount",
      width: 90,
      align: "center",
    },
    {
      title: "Tổng tiền gốc",
      dataIndex: "totalPaidAmountCents",
      key: "totalPaidAmountCents",
      width: 160,
      align: "right",
      render: (v) => money(v),
    },
    {
      title: "Hoa hồng Admin (20%)",
      dataIndex: "adminCommissionCents",
      key: "adminCommissionCents",
      width: 180,
      align: "right",
      render: (v) => money(v),
    },
    {
      title: "Teacher nhận (80%)",
      dataIndex: "revenueCents",
      key: "revenueCents",
      width: 160,
      align: "right",
      render: (v) => money(v),
    },
  ];

  // ===================== INIT =====================
  useEffect(() => {
    reloadRevenueTab(yearMonth);
    reloadPayoutTab(yearMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeMonth = (v) => {
    const ym = (v || dayjs()).format("YYYY-MM");
    setYearMonth(ym);
    reloadRevenueTab(ym);
    reloadPayoutTab(ym);

    if (payoutView === "HISTORY") loadHistory(ym);
  };

  // ===================== RENDER =====================
  return (
    <div className={s.page}>
      <div className={s.titleRow}>
        <div>
          <div className={s.title}>Tài chính</div>
          <div className={s.subtitle}>
            Theo dõi doanh thu hệ thống và payout giáo viên theo tháng.
          </div>
        </div>

        <Space className={s.monthPicker}>
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
        className={s.tabs}
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
                    className={`${s.summaryCard} ${
                      activeRevenueView === "PAYMENTS" ? s.activeCard : ""
                    }`}
                    loading={revLoading}
                    hoverable
                    onClick={() => setActiveRevenueView("PAYMENTS")}
                  >
                    <Statistic
                      title={`Tổng tiền đã thanh toán (PAID)`}
                      value={fmtVnd(paymentsRes?.totalPaidCents || 0)}
                      suffix="VNĐ"
                    />
                    <div className={s.summaryHint}>
                      Bấm để xem danh sách payments.
                    </div>
                  </Card>

                  <Card
                    className={`${s.summaryCard} ${
                      activeRevenueView === "COURSE_TOTAL" ? s.activeCard : ""
                    }`}
                    loading={revLoading}
                    hoverable
                    onClick={() => setActiveRevenueView("COURSE_TOTAL")}
                  >
                    <Statistic
                      title={`Tổng doanh thu khóa học (gross) - ${yearMonth}`}
                      value={fmtVnd(courseTotal?.revenueCents || 0)}
                      suffix="VNĐ"
                    />
                    <div className={s.summaryHint}>
                      Bấm để xem giao dịch doanh thu khóa học.
                    </div>
                  </Card>
                </div>

                <Card
                  className={s.tableWrap}
                  title={
                    activeRevenueView === "PAYMENTS"
                      ? "Lịch sử payments"
                      : "Giao dịch doanh thu khóa học"
                  }
                  loading={revLoading}
                >
                  <div className={s.tableScroll}>
                    {activeRevenueView === "PAYMENTS" ? (
                      <Table
                        rowKey={(r) => r.id}
                        columns={paymentColumns}
                        dataSource={paymentsRes?.payments || []}
                        pagination={{
                          current: (paymentsRes?.currentPage || 0) + 1,
                          pageSize: paymentsRes?.pageSize || 20,
                          total: paymentsRes?.totalElements || 0,
                          showSizeChanger: false,
                          onChange: (page) =>
                            fetchPayments({
                              page: page - 1,
                              pageSize: paymentsRes?.pageSize || 20,
                              filterStatus: "ALL",
                            }),
                        }}
                        scroll={{ x: 1100 }}
                      />
                    ) : (
                      <Table
                        rowKey={(r) => r.id}
                        columns={courseTxColumns}
                        dataSource={courseTotal?.transactions || []}
                        pagination={false}
                        scroll={{ x: 1000 }}
                      />
                    )}
                  </div>
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
                      title={`Hoa hồng Admin (${yearMonth})`}
                      value={fmtVnd(commission?.paidRevenueCents || 0)}
                      suffix="VNĐ"
                    />

                    <div className={s.commissionBreakdown}>
                      <div className={s.commissionRow}>
                        <span className={s.label}>Tổng sau khi thu được:</span>
                        <span className={s.valuePaid}>
                          {fmtVnd(commission?.totalRevenueCents || 0)} VNĐ
                        </span>
                      </div>

                      <div className={s.commissionRow}>
                        <span className={s.label}>Dự kiến sẽ thu:</span>
                        <span className={s.valueExpected}>
                          {fmtVnd(commission?.expectedRevenueCents || 0)} VNĐ
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className={s.summaryCard} loading={payoutLoading}>
                    <Statistic
                      title={`Teacher cần payout (${yearMonth})`}
                      value={pendingTeachers}
                    />
                    <div className={s.summaryHint}>
                      Danh sách teacher có doanh thu chưa trả.
                    </div>
                  </Card>

                  <Card className={s.summaryCard} loading={payoutLoading}>
                    <Statistic
                      title={`Tổng tiền cần chuyển`}
                      value={fmtVnd(pendingAmount)}
                      suffix="VNĐ"
                    />
                    <div className={s.summaryHint}>
                      Số khóa: {pendingCourses} • Số GD: {pendingSales}
                    </div>
                  </Card>
                </div>
                <div className={s.payoutSubTabs}>
                  <button
                    className={`${s.payoutSubTab} ${
                      payoutView === "PENDING" ? s.active : ""
                    }`}
                    onClick={() => setPayoutView("PENDING")}
                    type="button"
                  >
                    Chờ chuyển
                  </button>

                  <button
                    className={`${s.payoutSubTab} ${
                      payoutView === "HISTORY" ? s.active : ""
                    }`}
                    onClick={async () => {
                      setPayoutView("HISTORY");
                      if (historyRows.length === 0)
                        await loadHistory(yearMonth);
                    }}
                    type="button"
                  >
                    Lịch sử đã chuyển
                  </button>
                </div>

                {payoutView === "PENDING" ? (
                  <Card
                    className={s.tableWrap}
                    title="Danh sách teacher chưa được chuyển tiền"
                    loading={payoutLoading}
                  >
                    <div className={s.tableScroll}>
                      <Table
                        rowKey={(r) => `${r.teacherId}-${r.yearMonth}`}
                        columns={payoutColumns}
                        dataSource={rows}
                        pagination={false}
                        scroll={{ x: 1250 }}
                      />
                    </div>
                  </Card>
                ) : (
                  <Card
                    className={s.tableWrap}
                    title="Lịch sử admin đã chuyển tiền"
                    loading={historyLoading}
                  >
                    <div className={s.tableScroll}>
                      <Table
                        rowKey={(r) =>
                          `${r.teacherId}-${r.payoutDate || r.yearMonth}`
                        }
                        columns={payoutHistoryCols}
                        dataSource={historyRows}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 1400 }}
                        expandable={{
                          expandedRowRender: (record) => (
                            <Table
                              rowKey={(x) => x.courseId}
                              columns={payoutHistoryCourseCols}
                              dataSource={record?.courses || []}
                              pagination={false}
                              size="small"
                              scroll={{ x: 1200 }}
                            />
                          ),
                          rowExpandable: (record) =>
                            Array.isArray(record?.courses) &&
                            record.courses.length > 0,
                        }}
                      />
                    </div>
                  </Card>
                )}

                {/* DETAIL MODAL */}
                <Modal
                  open={openDetail}
                  onCancel={() => setOpenDetail(false)}
                  footer={null}
                  width={1120}
                  title={
                    detail?.teacherName
                      ? `Chi tiết payout - ${detail.teacherName}`
                      : "Chi tiết payout"
                  }
                  destroyOnClose
                >
                  <div className={s.modalBody}>
                    <div className={s.payoutDetailHeader}>
                      <div className={s.payoutDetailInfo}>
                        <Descriptions bordered column={2} size="middle">
                          <Descriptions.Item label="Teacher">
                            {detail?.teacherName || "—"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Email">
                            {detail?.teacherEmail || "—"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Tháng">
                            {detail?.yearMonth || yearMonth}
                          </Descriptions.Item>
                          <Descriptions.Item label="Trạng thái">
                            {renderPayoutStatus(detail?.payoutStatus)}
                          </Descriptions.Item>

                          <Descriptions.Item label="Ngân hàng">
                            {detail?.bankName || "—"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Số TK">
                            {detail?.bankAccountNumber || "—"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Chủ TK">
                            {detail?.bankAccountName || "—"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Chi nhánh">
                            {detail?.bankBranchName || "—"}
                          </Descriptions.Item>
                        </Descriptions>
                      </div>
                    </div>

                    <div className={s.modalSectionTitle}>Theo khóa học</div>

                    <div className={s.tableScrollModal}>
                      <Table
                        rowKey={(r) => r.courseId}
                        columns={payoutDetailCourseCols}
                        dataSource={detailCourses}
                        loading={detailLoading}
                        pagination={false}
                        tableLayout="fixed"
                        size="middle"
                        scroll={{ x: 1180 }}
                      />
                    </div>
                  </div>
                </Modal>

                {/* MARK PAID MODAL */}
                <Modal
                  open={openPaid}
                  onCancel={() => setOpenPaid(false)}
                  onOk={submitMarkPaid}
                  okText="Xác nhận"
                  cancelText="Hủy"
                  confirmLoading={paying}
                  title={
                    target?.teacherName
                      ? `Đánh dấu đã chuyển - ${target.teacherName}`
                      : "Đánh dấu đã chuyển"
                  }
                  destroyOnClose
                >
                  <div className={s.formNote}>
                    <div className={s.formLabel}>Ghi chú (tuỳ chọn)</div>
                    <Input.TextArea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="VD: Đã chuyển tiền ngày 22/12/2025"
                      rows={4}
                    />
                    <div className={s.formHint}>
                      Sau khi xác nhận, teacher sẽ không còn nằm trong danh sách
                      pending của tháng này.
                    </div>
                  </div>
                </Modal>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
