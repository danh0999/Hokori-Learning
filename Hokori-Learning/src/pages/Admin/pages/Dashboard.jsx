import React, { useState, useEffect } from "react";
import s from "./Dashboard.module.scss";
import { Line, Bar, Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

// React Icons
import { FaUsers, FaChalkboardTeacher, FaMoneyBillWave } from "react-icons/fa";
import { MdPendingActions } from "react-icons/md";
import { AiOutlineFileSearch, AiOutlineRobot } from "react-icons/ai";

Chart.register(...registerables);

// FIX lỗi canvas reuse (React 18 Strict Mode)
Chart.register({
  id: "safe",
  beforeDraw: (chart) => {
    if (chart.canvas) {
      const ctx = chart.canvas.getContext("2d");
      ctx.save();
    }
  },
});

export default function AdminDashboard() {
  // ======================
  // MOCK DATA (SKELETON)
  // ======================

  /**
   * TODO(API):
   * GET /admin/dashboard/stats
   * Dữ liệu thật sẽ trả về object stats như dưới
   */
  const [stats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    monthRevenue: 0,
    pendingWithdrawals: 0,
    pendingCertificates: 0,
    aiPackageSales: 0,
  });

  /**
   * TODO(API):
   * GET /admin/dashboard/revenue-chart
   */
  const [revenueChart] = useState({
    labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
    values: [5, 10, 20, 15, 30, 25],
  });

  /**
   * TODO(API):
   * GET /admin/dashboard/users-chart
   */
  const [userChart] = useState({
    labels: ["T1", "T2", "T3", "T4", "T5", "T6"],
    values: [200, 250, 300, 400, 380, 500],
  });

  /**
   * TODO(API):
   * GET /admin/dashboard/roles-chart
   */
  const [roleChart] = useState({
    labels: ["Learner", "Teacher", "Moderator", "Admin"],
    values: [11200, 320, 12, 4],
  });

  /**
   * TODO(API):
   * GET /admin/dashboard/top-teachers
   */
  const [topTeachers] = useState([
    { id: 1, name: "Nguyễn Văn A", revenue: 12000000 },
    { id: 2, name: "Trần Thị B", revenue: 9500000 },
  ]);

  /**
   * TODO(API):
   * GET /admin/dashboard/recent-transactions
   */
  const [recentTx] = useState([
    { id: 1, content: "Mua gói AI Pro", date: "2025-11-10 08:30" },
    { id: 2, content: "Đăng ký JLPT N3", date: "2025-11-10 10:00" },
  ]);

  return (
    <div className={s.page}>
      <h1 className={s.title}>Tổng quan hệ thống</h1>

      {/* ================= TOP CARDS ================= */}
      <div className={s.statGrid}>

        <Stat label="Tổng người dùng" value={stats.totalUsers} icon={<FaUsers />} />
        <Stat label="Giáo viên" value={stats.totalTeachers} icon={<FaChalkboardTeacher />} />
        <Stat label="Doanh thu tháng" value={stats.monthRevenue + " đ"} icon={<FaMoneyBillWave />} />
        <Stat label="Đơn rút tiền chờ" value={stats.pendingWithdrawals} icon={<MdPendingActions />} />
        <Stat label="Chứng chỉ chờ duyệt" value={stats.pendingCertificates} icon={<AiOutlineFileSearch />} />
        <Stat label="Gói AI bán" value={stats.aiPackageSales} icon={<AiOutlineRobot />} />

      </div>

      {/* ================= CHARTS ================= */}
      <div className={s.chartGrid}>
        <ChartCard title="Doanh thu theo tháng">
          <Line data={lineChart(revenueChart)} options={{ responsive: true, animation: false }} />
        </ChartCard>

        <ChartCard title="Người dùng mới">
          <Bar data={barChart(userChart)} options={{ responsive: true, animation: false }} />
        </ChartCard>

        <ChartCard title="Tỷ lệ vai trò">
          <Pie data={pieChart(roleChart)} options={{ responsive: true, animation: false }} />
        </ChartCard>
      </div>

      {/* ================= LOWER SECTIONS ================= */}
      <div className={s.bottomGrid}>

        <div className={s.box}>
          <h3>Top giáo viên doanh thu cao</h3>
          <ul className={s.list}>
            {topTeachers.map((t) => (
              <li key={t.id}>
                <span>{t.name}</span>
                <strong>{t.revenue.toLocaleString()} đ</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className={s.box}>
          <h3>Hoạt động gần đây</h3>
          <ul className={s.list}>
            {recentTx.map((tx) => (
              <li key={tx.id}>
                <span>{tx.content}</span>
                <small>{tx.date}</small>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

const Stat = ({ label, value, icon }) => (
  <div className={s.statCard}>
    <div className={s.icon}>{icon}</div>
    <div>
      <p className={s.label}>{label}</p>
      <h3 className={s.value}>{value}</h3>
    </div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className={s.chartCard}>
    <h3>{title}</h3>
    {children}
  </div>
);

/* ================= CHART HELPERS ================= */

const lineChart = (data) => ({
  labels: data.labels,
  datasets: [
    {
      label: "Doanh thu",
      data: data.values,
      borderColor: "#2563eb",
      backgroundColor: "rgba(37,99,235,0.2)",
      tension: 0.35,
    },
  ],
});

const barChart = (data) => ({
  labels: data.labels,
  datasets: [
    {
      label: "Số lượng",
      data: data.values,
      backgroundColor: "#60a5fa",
    },
  ],
});

const pieChart = (data) => ({
  labels: data.labels,
  datasets: [
    {
      data: data.values,
      backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
    },
  ],
});
