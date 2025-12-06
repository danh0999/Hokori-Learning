import React, { useState, useEffect } from "react";
import s from "./Dashboard.module.scss";
import { Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

// axios client dùng chung của project (đổi path theo project của bà)
import api from "../../../configs/axios.js";

// React Icons
import { FaUsers } from "react-icons/fa";
import { MdVerifiedUser, MdOutlinePendingActions } from "react-icons/md";
import { RiUserFollowFill, RiUserUnfollowFill } from "react-icons/ri";
import { HiOutlineUserGroup } from "react-icons/hi";

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
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ====== CALL API /api/admin/dashboard ======
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("admin/dashboard");
        // BE trả: { success, message, data, ... }
        setDashboard(res.data.data);
      } catch (err) {
        console.error("Fetch admin dashboard error:", err);
        setError("Không tải được dữ liệu dashboard. Thử lại sau nhé.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const overview = dashboard?.overview ?? {};
  const lastUpdated = dashboard?.lastUpdated
    ? new Date(dashboard.lastUpdated).toLocaleString("vi-VN")
    : "-";

  // ====== CHART DATA MAPPING ======
  const roleChartData = dashboard
    ? {
        labels: Object.keys(dashboard.roleDistribution),
        values: Object.values(dashboard.roleDistribution),
      }
    : { labels: [], values: [] };

  const jlptChartData = dashboard
    ? {
        labels: Object.keys(dashboard.jlptDistribution),
        values: Object.values(dashboard.jlptDistribution),
      }
    : { labels: [], values: [] };

  const recentUsers = dashboard?.recentUsers ?? [];

  return (
    <div className={s.page}>
      <div className={s.headerRow}>
        <h1 className={s.title}>Admin Dashboard</h1>
        <span className={s.lastUpdated}>
          Cập nhật lần cuối: <strong>{lastUpdated}</strong>
        </span>
      </div>

      {/* ====== LOADING / ERROR ====== */}
      {loading && <p>Đang tải dữ liệu...</p>}
      {error && !loading && <p className={s.error}>{error}</p>}

      {!loading && !error && dashboard && (
        <>
          {/* ================= TOP CARDS ================= */}
          <div className={s.statGrid}>
            <Stat
              label="Tổng người dùng"
              value={overview.totalUsers}
              icon={<FaUsers />}
            />
            <Stat
              label="Người dùng đang hoạt động"
              value={overview.activeUsers}
              icon={<RiUserFollowFill />}
            />
            <Stat
              label="Người dùng không hoạt động"
              value={overview.inactiveUsers}
              icon={<RiUserUnfollowFill />}
            />
            <Stat
              label="Đã xác thực"
              value={overview.verifiedUsers}
              icon={<MdVerifiedUser />}
            />
            <Stat
              label="Chưa xác thực"
              value={overview.unverifiedUsers}
              icon={<MdOutlinePendingActions />}
            />
            <Stat
              label="Số vai trò"
              value={overview.totalRoles}
              icon={<HiOutlineUserGroup />}
            />
          </div>

          {/* ================= CHARTS ================= */}
          <div className={s.chartGrid}>
            <ChartCard title="Phân bố vai trò người dùng">
              <Pie
                data={pieChart(roleChartData)}
                options={{ responsive: true, animation: false }}
              />
            </ChartCard>

            <ChartCard title="Phân bố level JLPT">
              <Pie
                data={pieChart(jlptChartData)}
                options={{ responsive: true, animation: false }}
              />
            </ChartCard>
          </div>

          {/* ================= RECENT USERS ================= */}
          <div className={s.bottomGrid}>
            <div className={s.box}>
              <div className={s.boxHeader}>
                <h3>Người dùng mới đăng ký</h3>
                <span className={s.boxSub}>
                  Hiển thị {recentUsers.length} user gần nhất
                </span>
              </div>

              <div className={s.tableWrapper}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Display name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.displayName || "-"}</td>
                        <td>{u.username || "-"}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={s.roleBadge}>{u.roleName}</span>
                        </td>
                      </tr>
                    ))}
                    {recentUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center" }}>
                          Chưa có user nào gần đây
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
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
    <div className={s.chartHeader}>
      <h3>{title}</h3>
    </div>
    {children}
  </div>
);

/* ================= CHART HELPERS ================= */

const pieChart = (data) => {
  const palette = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#6366f1",
    "#ec4899",
    "#22c55e",
  ];

  return {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: data.labels.map(
          (_, idx) => palette[idx % palette.length]
        ),
      },
    ],
  };
};
