import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import s from "./Dashboard.module.scss";
import { Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

import api from "../../../configs/axios.js";

// React Icons
import { FaUsers } from "react-icons/fa";
import { MdVerifiedUser, MdOutlinePendingActions } from "react-icons/md";
import { RiUserFollowFill, RiUserUnfollowFill } from "react-icons/ri";
import { HiOutlineUserGroup } from "react-icons/hi";
import { AiOutlineMoneyCollect } from "react-icons/ai";
import { FaMoneyBillWave } from "react-icons/fa";

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

const formatVnd = (n) => {
  const num = typeof n === "number" ? n : Number(n || 0);
  return num.toLocaleString("vi-VN") + " ₫";
};

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

        const res = await api.get("/admin/dashboard");
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
  const revenueSummary = dashboard?.revenueSummary ?? {};
  const topTeachers = dashboard?.topTeachersByRevenue ?? [];

  const lastUpdated = dashboard?.lastUpdated
    ? new Date(dashboard.lastUpdated).toLocaleString("vi-VN")
    : "-";

  // ====== CHART DATA MAPPING ======
  const roleChartData = dashboard
    ? {
        labels: Object.keys(dashboard.roleDistribution || {}),
        values: Object.values(dashboard.roleDistribution || {}),
      }
    : { labels: [], values: [] };

  const jlptChartData = dashboard
    ? {
        labels: Object.keys(dashboard.jlptDistribution || {}),
        values: Object.values(dashboard.jlptDistribution || {}),
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
          {/* ================= TOP CARDS: USER + REVENUE ================= */}
          <div className={s.statGrid}>
            {/* -------- USER OVERVIEW -------- */}
            <Stat
              label="Tổng người dùng"
              value={overview.totalUsers ?? 0}
              icon={<FaUsers />}
            />

            {/* -------- REVENUE SUMMARY (dùng theo guide BE) -------- */}
            {/* <Stat
              label="Tổng doanh thu hệ thống"
              value={formatVnd(
                revenueSummary.totalRevenue ??
                  (revenueSummary.totalRevenueCents != null
                    ? revenueSummary.totalRevenueCents / 100
                    : 0)
              )}
              icon={<AiOutlineMoneyCollect />}
            />
            <Stat
              label="Doanh thu tháng này"
              value={formatVnd(
                revenueSummary.monthlyRevenue ??
                  (revenueSummary.monthlyRevenueCents != null
                    ? revenueSummary.monthlyRevenueCents / 100
                    : 0)
              )}
              icon={<FaMoneyBillWave />}
            />
            <Stat
              label="Giao dịch thành công"
              value={revenueSummary.completedTransactions ?? 0}
              icon={<FaMoneyBillWave />}
            />
            <Stat
              label="Phí nền tảng đã thu"
              value={formatVnd(
                revenueSummary.platformFee ??
                  (revenueSummary.platformFeeCents != null
                    ? revenueSummary.platformFeeCents / 100
                    : 0)
              )}
              icon={<AiOutlineMoneyCollect />}
            /> */}
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

          {/* ================= BOTTOM: RECENT USERS + TOP TEACHERS ================= */}
          <div className={s.bottomGrid}>
            {/* ----- RECENT USERS ----- */}
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

            {/* ----- TOP TEACHERS BY REVENUE (dùng revenue api) ----- */}
            {/* <div className={s.box}>
              <div className={s.boxHeader}>
                <h3>Top giáo viên theo doanh thu</h3>
                <span className={s.boxSub}>
                  Dữ liệu từ BE: tổng & doanh thu tháng hiện tại
                </span>
              </div>

              <div className={s.tableWrapper}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Giáo viên</th>
                      <th>Doanh thu tháng</th>
                      <th>Tổng doanh thu</th>
                      <th>Số khóa học</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTeachers.map((t) => {
                      const monthRevenue =
                        t.monthlyRevenue ??
                        (t.monthlyRevenueCents != null
                          ? t.monthlyRevenueCents / 100
                          : 0);

                      const totalRevenue =
                        t.totalRevenue ??
                        (t.totalRevenueCents != null
                          ? t.totalRevenueCents / 100
                          : 0);

                      return (
                        <tr key={t.teacherId}>
                          <td>{t.teacherId}</td>
                          <td>{t.teacherName}</td>
                          <td>{formatVnd(monthRevenue)}</td>
                          <td>{formatVnd(totalRevenue)}</td>
                          <td>{t.courseCount ?? "-"}</td>
                          <td style={{ textAlign: "right" }}>
                            <Link
                              to={`/admin/revenue/${t.teacherId}`}
                              className={s.linkButton}
                            >
                              Xem doanh thu
                            </Link>
                          </td>
                        </tr>
                      );
                    })}

                    {topTeachers.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center" }}>
                          Chưa có dữ liệu doanh thu giáo viên
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div> */}
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
