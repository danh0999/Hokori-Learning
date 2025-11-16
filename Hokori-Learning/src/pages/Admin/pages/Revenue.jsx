import React, { useEffect, useState } from "react";
import s from "./Revenue.module.scss";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

import DataTable from "../components/DataTable";
import { toast } from "react-toastify";
import { AiOutlineMoneyCollect } from "react-icons/ai";
import { FaShoppingCart } from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);


//Chart.register(...registerables);

// Chart safe mode fix (React StrictMode)
// Chart.register({
//   id: "safe",
//   beforeDraw: (chart) => {
//     if (chart.canvas) {
//       const ctx = chart.canvas.getContext("2d");
//       ctx.save();
//     }
//   },
// });

// =========================
// Modal xem chi tiết giao dịch
// =========================
const DetailModal = ({ open, data, onClose }) => {
  if (!open || !data) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>Chi tiết giao dịch</h2>

        <div className={s.modalBlock}>
          <p><strong>Người mua:</strong> {data.buyer}</p>
          <p><strong>Người nhận:</strong> {data.teacher}</p>
          <p><strong>Loại:</strong> {data.type}</p>
          <p><strong>Sản phẩm:</strong> {data.item}</p>
          <p><strong>Số tiền:</strong> {data.amount.toLocaleString()}₫</p>
          <p><strong>Phí nền tảng:</strong> {data.fee.toLocaleString()}₫</p>
          <p><strong>Ngày thanh toán:</strong> {data.date}</p>
          <p><strong>Trạng thái:</strong> {data.status}</p>
        </div>

        <div className={s.modalActions}>
          <button className={s.btnGhost} onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default function Revenue() {
  // =========================
  // SUMMARY DATA
  // =========================
  /**
   * TODO(API): GET /api/admin/revenue/summary
   */
  const [summary] = useState({
    totalRevenue: 128_500_000,
    monthRevenue: 12_500_000,
    completedCount: 425,
    platformFee: 18_300_000,
  });

  // =========================
  // CHART DATA
  // =========================
  /**
   * TODO(API): GET /api/admin/revenue/chart
   */
  const [chartData] = useState({
    labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
    values: [10, 12, 18, 14, 22, 28],
  });

  // =========================
  // TABLE DATA
  // =========================
  /**
   * TODO(API): GET /api/admin/revenue/transactions
   */
  const [txList] = useState([
    {
      id: 1,
      buyer: "Nguyễn Văn A",
      teacher: "Trần Thị B",
      type: "Khóa học",
      item: "JLPT N3 Full",
      amount: 650000,
      fee: 65000,
      date: "2025-11-12 09:30",
      status: "SUCCESS",
    },
    {
      id: 2,
      buyer: "User 02",
      teacher: "Teacher X",
      type: "Gói AI",
      item: "AI Pro 30 ngày",
      amount: 199000,
      fee: 19900,
      date: "2025-11-13 12:15",
      status: "SUCCESS",
    },
  ]);

  const [detailItem, setDetailItem] = useState(null);

  const columns = [
    { header: "Người mua", accessor: "buyer" },
    { header: "Giáo viên", accessor: "teacher" },
    { header: "Loại", accessor: "type" },
    { header: "Sản phẩm", accessor: "item" },
    {
      header: "Số tiền",
      render: (r) => r.amount.toLocaleString() + "₫",
    },
    {
      header: "Phí nền tảng",
      render: (r) => r.fee.toLocaleString() + "₫",
    },
    { header: "Ngày", accessor: "date" },
    {
      header: "Trạng thái",
      render: (r) => (
        <span
          className={
            r.status === "SUCCESS"
              ? `${s.status} ${s.success}`
              : `${s.status} ${s.failed}`
          }
        >
          {r.status}
        </span>
      ),
    },
    {
      header: "Chi tiết",
      render: (row) => (
        <button className={s.btnSmall} onClick={() => setDetailItem(row)}>
          Xem
        </button>
      ),
    },
  ];

  return (
    <div className={s.page}>
      <h1 className={s.title}>Doanh thu & Tài chính</h1>

      {/* ===== SUMMARY CARDS ===== */}
      <div className={s.summaryGrid}>
        <SummaryCard
          icon={<AiOutlineMoneyCollect />}
          label="Tổng doanh thu"
          value={summary.totalRevenue.toLocaleString() + "₫"}
        />
        <SummaryCard
          icon={<FaShoppingCart />}
          label="Doanh thu tháng"
          value={summary.monthRevenue.toLocaleString() + "₫"}
        />
        <SummaryCard
          icon={<FaShoppingCart />}
          label="Giao dịch hoàn tất"
          value={summary.completedCount}
        />
        <SummaryCard
          icon={<AiOutlineMoneyCollect />}
          label="Phí nền tảng thu được"
          value={summary.platformFee.toLocaleString() + "₫"}
        />
      </div>

      {/* ===== CHART ===== */}
      <div className={s.chartCard}>
        <h3>Biểu đồ doanh thu theo tháng</h3>
        <Line
          data={{
            labels: chartData.labels,
            datasets: [
              {
                label: "Doanh thu",
                data: chartData.values,
                borderColor: "#2563eb",
                backgroundColor: "rgba(37,99,235,0.2)",
                tension: 0.35,
              },
            ],
          }}
          options={{ animation: false }}
        />
      </div>

      {/* ===== TABLE ===== */}
      <h2 className={s.sectionTitle}>Lịch sử giao dịch</h2>

      <div className={s.tableWrap}>
        <DataTable columns={columns} data={txList} />
      </div>

      {/* ===== MODAL DETAIL ===== */}
      <DetailModal
        open={!!detailItem}
        data={detailItem}
        onClose={() => setDetailItem(null)}
      />
    </div>
  );
}

const SummaryCard = ({ icon, label, value }) => (
  <div className={s.summaryCard}>
    <div className={s.icon}>{icon}</div>

    <div className={s.info}>
      <p className={s.label}>{label}</p>
      <h3 className={s.value}>{value}</h3>
    </div>
  </div>
);
