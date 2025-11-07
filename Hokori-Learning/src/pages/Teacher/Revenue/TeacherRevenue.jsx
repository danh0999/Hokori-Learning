import React, { useState } from "react";
import { Card, Row, Col, Table, Button, Modal, Statistic, Tag } from "antd";
import {
  DollarOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import WithdrawModal from "./WithdrawModal";
import styles from "./TeacherRevenue.module.scss";

export default function TeacherRevenue() {
  // mock data (sẽ thay bằng API sau)
  const [balance] = useState(1200000);
  const [totalEarned] = useState(5000000);
  const [pendingWithdraw] = useState(300000);
  const [transactions] = useState([
    {
      id: 1,
      date: "2025-11-01",
      type: "EARNING",
      description: "Khóa JLPT N3 Listening",
      amount: 500000,
      status: "COMPLETED",
    },
    {
      id: 2,
      date: "2025-11-03",
      type: "WITHDRAW",
      description: "Rút tiền về ngân hàng",
      amount: -300000,
      status: "PENDING",
    },
  ]);

  const [openWithdraw, setOpenWithdraw] = useState(false);

  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Loại giao dịch",
      dataIndex: "type",
      key: "type",
      render: (t) =>
        t === "EARNING" ? (
          <Tag color="green">Thu nhập</Tag>
        ) : (
          <Tag color="volcano">Rút tiền</Tag>
        ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Số tiền (VNĐ)",
      dataIndex: "amount",
      key: "amount",
      render: (val) => (
        <span style={{ color: val > 0 ? "green" : "red", fontWeight: 500 }}>
          {val > 0 ? "+" : ""}
          {val.toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (st) => (
        <Tag
          color={
            st === "COMPLETED" ? "green" : st === "PENDING" ? "orange" : "red"
          }
        >
          {st === "COMPLETED"
            ? "Hoàn tất"
            : st === "PENDING"
            ? "Đang xử lý"
            : "Từ chối"}
        </Tag>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Ví & Doanh thu của bạn</h2>

      {/* --- Summary Cards --- */}
      <Row gutter={16} className={styles.summaryRow}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Số dư hiện tại"
              value={balance}
              valueStyle={{ color: "#3f8600" }}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Tổng thu nhập"
              value={totalEarned}
              valueStyle={{ color: "#1677ff" }}
              prefix={<ArrowUpOutlined />}
              suffix="VNĐ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Đang chờ rút"
              value={pendingWithdraw}
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
      <Card className={styles.tableCard} title="Lịch sử giao dịch">
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* --- Withdraw Modal --- */}
      <WithdrawModal
        open={openWithdraw}
        onCancel={() => setOpenWithdraw(false)}
        onSubmit={(amount) => {
          console.log("Withdraw:", amount);
          setOpenWithdraw(false);
        }}
      />
    </div>
  );
}
