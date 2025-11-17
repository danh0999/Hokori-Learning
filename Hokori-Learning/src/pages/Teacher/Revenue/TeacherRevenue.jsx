// src/pages/Teacher/Revenue/TeacherRevenue.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Card, Row, Col, Table, Button, Statistic, Tag, message } from "antd";
import {
  DollarOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import WithdrawModal from "./WithdrawModal";
import styles from "./TeacherRevenue.module.scss";

import {
  fetchMyWallet,
  fetchMyWalletTransactions,
  selectWalletInfo,
  selectWalletTransactionsPage,
  selectWalletStatus,
  selectWalletTransactionsStatus,
} from "../../../redux/features/walletSlice.js"; // ⚠️ chỉnh lại path cho đúng

export default function TeacherRevenue() {
  const dispatch = useDispatch();

  // ====== Redux state ======
  const wallet = useSelector(selectWalletInfo);
  const walletStatus = useSelector(selectWalletStatus);
  const txPage = useSelector(selectWalletTransactionsPage);
  const txStatus = useSelector(selectWalletTransactionsStatus);

  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [page, setPage] = useState(1); // Antd index 1, BE index 0

  // load ví + transactions lần đầu
  useEffect(() => {
    dispatch(fetchMyWallet());
    dispatch(
      fetchMyWalletTransactions({
        page: 0,
        size: 10,
        sort: ["createdAt,desc"],
      })
    );
  }, [dispatch]);

  const loading = walletStatus === "loading" || txStatus === "loading";

  const balanceCents = wallet?.walletBalance ?? 0;
  const balanceVnd = balanceCents / 100;

  const totalEarned = 0; // nếu BE có field này trong /wallet/me thì map thêm ở walletSlice
  const pendingWithdraw = 0; // sau này BE làm withdraw thì thêm

  const transactions = useMemo(() => txPage?.content || [], [txPage]);

  const columns = [
    {
      title: "Ngày",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val) => new Date(val).toLocaleString("vi-VN"),
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
            style={{
              color: amount > 0 ? "green" : "red",
              fontWeight: 500,
            }}
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

  // change page trong table -> gọi lại API
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

  // tạm thời: khi teacher bấm rút tiền, chỉ validate + show message
  // vì BE chưa có API withdraw request
  const handleSubmitWithdraw = async (amount) => {
    if (amount > balanceVnd) {
      message.warning("Số tiền rút vượt quá số dư hiện tại");
      return;
    }

    // TODO: khi BE có API withdraw request, gọi ở đây
    console.log("Withdraw request amount =", amount);
    message.info("Chức năng rút tiền sẽ được kích hoạt khi BE hoàn thành API.");
    setOpenWithdraw(false);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Ví & Doanh thu của bạn</h2>

      {/* --- Summary Cards --- */}
      <Row gutter={16} className={styles.summaryRow}>
        <Col xs={24} sm={12} md={8}>
          <Card loading={loading}>
            <Statistic
              title="Số dư hiện tại"
              value={balanceVnd}
              valueStyle={{ color: "#3f8600" }}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card loading={loading}>
            <Statistic
              title="Tổng thu nhập (tạm tính)"
              value={totalEarned / 100}
              valueStyle={{ color: "#1677ff" }}
              prefix={<ArrowUpOutlined />}
              suffix="VNĐ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card loading={loading}>
            <Statistic
              title="Đang chờ rút"
              value={pendingWithdraw / 100}
              valueStyle={{ color: "#fa8c16" }}
              prefix={<ArrowDownOutlined />}
              suffix="VNĐ"
            />
          </Card>
        </Col>
      </Row>

      {/* --- Withdraw Button --- */}
      <div className={styles.actions}>
        <Button
          type="primary"
          size="large"
          onClick={() => setOpenWithdraw(true)}
          icon={<ArrowDownOutlined />}
        >
          Rút tiền
        </Button>
      </div>

      {/* --- Transactions Table --- */}
      <Card
        className={styles.tableCard}
        title="Lịch sử giao dịch"
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

      {/* --- Withdraw Modal --- */}
      <WithdrawModal
        open={openWithdraw}
        maxAmount={balanceVnd}
        onCancel={() => setOpenWithdraw(false)}
        onSubmit={handleSubmitWithdraw}
      />
    </div>
  );
}
