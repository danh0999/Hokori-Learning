// src/pages/Teacher/Revenue/TeacherRevenue.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Statistic,
  Tag,
  message,
  DatePicker,
  Space,
} from "antd";
import { DollarOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import styles from "./TeacherRevenue.module.scss";
import api from "../../../configs/axios.js";
import dayjs from "dayjs";

import {
  fetchMyWallet,
  fetchMyWalletTransactions,
  selectWalletInfo,
  selectWalletTransactionsPage,
  selectWalletStatus,
  selectWalletTransactionsStatus,
} from "../../../redux/features/walletSlice.js";

export default function TeacherRevenue() {
  const dispatch = useDispatch();
  const [monthRevenue, setMonthRevenue] = useState(null);
  const [monthLoading, setMonthLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  // ====== Redux state ======
  const wallet = useSelector(selectWalletInfo);
  const walletStatus = useSelector(selectWalletStatus);
  const txPage = useSelector(selectWalletTransactionsPage);
  const txStatus = useSelector(selectWalletTransactionsStatus);
  const [page, setPage] = useState(1); // Antd index 1, BE index 0

  const loading = walletStatus === "loading" || txStatus === "loading";

  // Ví: BE trả VND
  const balanceVnd = wallet?.walletBalance ?? 0;

  const transactions = useMemo(() => txPage?.content || [], [txPage]);

  const fetchMonthlyRevenue = async (year, month) => {
    try {
      setMonthLoading(true);
      const res = await api.get("/teacher/dashboard/revenue", {
        params: { year, month }, // 1-12
      });

      const payload = res.data?.data;
      setMonthRevenue(payload || null);
    } catch (err) {
      console.error("fetchMonthlyRevenue error:", err);
      message.error("Không tải được doanh thu tháng, vui lòng thử lại.");
    } finally {
      setMonthLoading(false);
    }
  };

  // lần đầu load: ví + transaction + doanh thu tháng hiện tại
  useEffect(() => {
    dispatch(fetchMyWallet());
    dispatch(
      fetchMyWalletTransactions({
        page: 0,
        size: 10,
        sort: ["createdAt,desc"],
      })
    );

    const now = dayjs();
    fetchMonthlyRevenue(now.year(), now.month() + 1);
  }, [dispatch]);

  const handleChangeMonth = (value) => {
    const m = value || dayjs();
    setSelectedMonth(m);
    fetchMonthlyRevenue(m.year(), m.month() + 1);
  };

  // Doanh thu tháng: ưu tiên field VND, fallback sang *Cents*
  const monthlyRevenueValue =
    monthRevenue?.revenueCents ??
    (monthRevenue?.revenue != null
      ? Math.round(monthRevenue.revenueCents / 100)
      : 0);

  const walletBalanceDisplay = monthRevenue?.walletBalance ?? balanceVnd ?? 0;

  const columns = [
    {
      title: "Ngày",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val) => (val ? new Date(val).toLocaleString("vi-VN") : ""),
    },
    {
      title: "Loại giao dịch",
      dataIndex: "source",
      key: "source",
      render: (s) => {
        if (s === "COURSE_SALE")
          return <Tag color="green">Tiền bán khóa học</Tag>;
        if (s === "TEACHER_PAYOUT") return <Tag color="volcano">Payout</Tag>;
        if (s === "ADMIN_ADJUST") return <Tag color="blue">Điều chỉnh</Tag>;
        return <Tag>{s}</Tag>;
      },
    },
    {
      title: "Số tiền (VNĐ)",
      dataIndex: "amountCents",
      key: "amountCents",
      render: (val) => {
        const amount = (val ?? 0) / 100;
        return (
          <span
            className={
              amount > 0 ? styles.amountPositive : styles.amountNegative
            }
          >
            {amount > 0 ? "+" : ""}
            {amount.toLocaleString("vi-VN")}
          </span>
        );
      },
    },
    {
      title: "Số dư sau giao dịch",
      dataIndex: "balanceAfterCents",
      key: "balanceAfterCents",
      render: (val) => ((val ?? 0) / 100).toLocaleString("vi-VN"),
    },
  ];

  const handleChangePage = (newPage) => {
    setPage(newPage);
    dispatch(
      fetchMyWalletTransactions({
        page: newPage - 1, // BE zero-based
        size: 10,
        sort: ["createdAt,desc"],
      })
    );
  };

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Ví & Doanh thu</h2>
          <p className={styles.subtitle}>
            Theo dõi số dư ví, doanh thu theo tháng và lịch sử giao dịch từ các
            khóa học bạn đã bán.
          </p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.monthLabel}>Chọn tháng</span>
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={handleChangeMonth}
            format="MM/YYYY"
            allowClear={false}
            className={styles.monthPicker}
          />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <Row gutter={16} className={styles.summaryRow}>
        <Col xs={24} sm={12} md={8}>
          <Card loading={monthLoading} className={styles.summaryCard}>
            <Statistic
              title={
                monthRevenue?.period
                  ? `Doanh thu tháng ${monthRevenue.period}`
                  : "Doanh thu tháng (tiền bán khóa học)"
              }
              value={monthlyRevenueValue}
              valueStyle={{ color: "#2563eb", fontWeight: 600 }}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
            />
            <div className={styles.summaryHint}>
              Số giao dịch: <b>{monthRevenue?.transactionCount ?? 0}</b>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card loading={loading} className={styles.summaryCard}>
            <Statistic
              title="Số dư ví hiện tại"
              value={walletBalanceDisplay}
              valueStyle={{ color: "#16a34a", fontWeight: 600 }}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
            />
            <div className={styles.summaryHint}>
              Được cập nhật sau mỗi giao dịch thành công.
            </div>
          </Card>
        </Col>
      </Row>

      {/* TRANSACTIONS TABLE */}
      <Card
        className={styles.tableCard}
        title={
          <div className={styles.tableHeader}>
            <div>
              <h3 className={styles.tableTitle}>Lịch sử giao dịch</h3>
              <p className={styles.tableSubtitle}>
                Danh sách các giao dịch gần đây nhất trong ví của bạn.
              </p>
            </div>
          </div>
        }
        loading={loading}
      >
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey={(r) => r.id || r.transactionId}
          pagination={{
            current: page,
            pageSize: txPage?.size || 10,
            total: txPage?.totalElements,
            onChange: handleChangePage,
          }}
        />
      </Card>
    </div>
  );
}
