import React, { useEffect, useMemo, useState } from "react";
import { Card, Table, Tag, Space, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../../configs/axios.js";
import styles from "./MyPaymentsPage.module.scss";

const statusColor = (s) => {
  switch (s) {
    case "PAID":
      return "green";
    case "PENDING":
      return "gold";
    case "CANCELLED":
    case "FAILED":
    case "EXPIRED":
      return "red";
    default:
      return "default";
  }
};

// ✅ PayOS amountCents của bạn đang là VND -> KHÔNG chia 100
const formatMoneyVND = (amountVnd) => {
  const v = Number(amountVnd ?? 0);
  return v.toLocaleString("vi-VN") + " ₫";
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
};

export default function MyPaymentsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("payment/my-payments", {
        params: { page, size, sort: `${sortField},${sortOrder}` },
      });

      const data = res?.data?.data;
      setRows(data?.content ?? []);
      setTotal(data?.totalElements ?? 0);
    } catch (err) {
      console.error(err);
      message.error("Không tải được lịch sử giao dịch.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sortField, sortOrder]);

  const columns = useMemo(
    () => [
      { title: "Mã giao dịch", dataIndex: "id", key: "id", width: 110 },
      {
        title: "OrderCode",
        dataIndex: "orderCode",
        key: "orderCode",
        width: 170,
      },
      {
        title: "Số tiền",
        dataIndex: "amountCents",
        key: "amountCents",
        width: 160,
        render: (v) => (
          <span className={styles.money}>{formatMoneyVND(v)}</span>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 130,
        render: (s) => <Tag color={statusColor(s)}>{s}</Tag>,
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
      },
      {
        title: "Tạo lúc",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 190,
        sorter: true,
        render: (v) => formatDateTime(v),
      },
      {
        title: "Thanh toán lúc",
        dataIndex: "paidAt",
        key: "paidAt",
        width: 190,
        render: (v) =>
          v ? formatDateTime(v) : <span className={styles.muted}>-</span>,
      },
      {
        title: "Hành động",
        key: "action",
        width: 120,
        render: (_, record) => (
          <Space className={styles.actionLink}>
            <Button
              type="link"
              onClick={() => navigate(`/my-payments/${record.id}`)}
            >
              Chi tiết
            </Button>
          </Space>
        ),
      },
    ],
    [navigate]
  );

  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter?.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order === "ascend" ? "asc" : "desc");
    }
  };

  return (
    <div className={styles.wrapper}>
      <Card
        className={styles.card}
        title={
          <div className={styles.cardTitle}>
            <div>
              <div>
                <b>Lịch sử giao dịch</b>
              </div>
              <div className={styles.subtitle}>
                Xem lại các giao dịch PayOS của bạn
              </div>
            </div>
          </div>
        }
      >
        <div className={styles.table}>
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={rows}
            onChange={handleTableChange}
            pagination={{
              current: page + 1,
              pageSize: size,
              total,
              showSizeChanger: false,
              onChange: (p) => {
                setPage(p - 1);
              },
            }}
          />
        </div>
      </Card>
    </div>
  );
}
