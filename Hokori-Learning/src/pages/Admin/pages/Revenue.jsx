import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import api from "../../../configs/axios.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// ========================
// Modal xem chi tiết giao dịch
// ========================
const DetailModal = ({ open, data, onClose }) => {
  if (!open || !data) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>Chi tiết giao dịch</h2>

        <div className={s.modalBlock}>
          <p>
            <strong>Người mua:</strong> {data.buyer}
          </p>
          <p>
            <strong>Người nhận:</strong> {data.teacher}
          </p>
          <p>
            <strong>Loại:</strong> {data.type}
          </p>
          <p>
            <strong>Sản phẩm:</strong> {data.item}
          </p>
          <p>
            <strong>Số tiền:</strong> {data.amount.toLocaleString()}₫
          </p>
          <p>
            <strong>Phí nền tảng:</strong> {data.fee.toLocaleString()}₫
          </p>
          <p>
            <strong>Ngày thanh toán:</strong> {data.date}
          </p>
          <p>
            <strong>Trạng thái:</strong> {data.status}
          </p>
        </div>

        <div className={s.modalActions}>
          <button className={s.btnGhost} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Revenue() {
  const { teacherId, courseId } = useParams();

  // =========================
  // SUMMARY DATA
  // =========================
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    monthRevenue: 0,
    completedCount: 0,
    platformFee: 0,
  });

  // =========================
  // CHART DATA
  // =========================
  const [chartData, setChartData] = useState({
    labels: [],
    values: [],
  });

  // =========================
  // TRANSACTION TABLE
  // =========================
  const [txList, setTxList] = useState([]);
  const [detailItem, setDetailItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // =========================
  // FETCH REVENUE DATA
  // =========================
  useEffect(() => {
    // /admin/revenue: chưa chọn teacher → không fetch API
    if (!teacherId) {
      setSummary({
        totalRevenue: 0,
        monthRevenue: 0,
        completedCount: 0,
        platformFee: 0,
      });
      setChartData({ labels: [], values: [] });
      setTxList([]);
      return;
    }

    const fetchRevenue = async () => {
      try {
        setLoading(true);

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 1-12

        // ----- MODE 1: Revenue theo 1 course cụ thể -----
        if (courseId) {
          const res = await api.get(
            `/api/admin/teachers/${teacherId}/courses/${courseId}/revenue`,
            {
              params: { year, month },
            }
          );

          const data = res.data?.data;

          if (!data) {
            setSummary({
              totalRevenue: 0,
              monthRevenue: 0,
              completedCount: 0,
              platformFee: 0,
            });
            setChartData({ labels: [], values: [] });
            setTxList([]);
            return;
          }

          const monthRevenue =
            data.revenue ??
            (data.revenueCents != null ? data.revenueCents / 100 : 0);

          setSummary({
            // Tổng all-time của 1 course BE chưa trả → dùng luôn doanh thu tháng
            totalRevenue: monthRevenue,
            monthRevenue,
            completedCount: data.transactionCount || 0,
            platformFee: 0, // chưa có field fee
          });

          setChartData({
            labels: [
              data.period || `${year}-${String(month).padStart(2, "0")}`,
            ],
            values: [monthRevenue],
          });

          const rows = Array.isArray(data.transactions)
            ? data.transactions
            : [];

          const mappedRows = rows.map((tx) => {
            const amount =
              tx.amount != null
                ? tx.amount
                : tx.amountCents != null
                ? tx.amountCents / 100
                : 0;

            const rawDate = tx.createdAt;
            const formattedDate = rawDate
              ? rawDate.replace("T", " ").slice(0, 16)
              : "";

            return {
              id: tx.id,
              buyer: "-", // BE chưa trả learnerName
              teacher: data.teacherName || "-",
              type: "Khóa học",
              item: data.courseTitle || "-",
              amount,
              fee: 0,
              date: formattedDate,
              status: "COMPLETED",
            };
          });

          setTxList(mappedRows);
          return;
        }

        // ----- MODE 2: Revenue theo teacher (tất cả courses) -----
        const [teacherRes, revRes] = await Promise.all([
          api.get(`/api/admin/teachers/${teacherId}`),
          api.get(`/api/admin/teachers/${teacherId}/revenue`, {
            params: { year, month },
          }),
        ]);

        const teacherData = teacherRes.data?.data;
        const revData = revRes.data?.data;

        const totalRevenue =
          teacherData?.revenue?.totalRevenue ??
          (teacherData?.revenue?.totalRevenueCents != null
            ? teacherData.revenue.totalRevenueCents / 100
            : 0);

        const monthRevenue =
          teacherData?.revenue?.monthlyRevenue ??
          (teacherData?.revenue?.monthlyRevenueCents != null
            ? teacherData.revenue.monthlyRevenueCents / 100
            : revData?.revenue ??
              (revData?.revenueCents != null ? revData.revenueCents / 100 : 0));

        setSummary({
          totalRevenue,
          monthRevenue,
          completedCount: revData?.transactionCount || 0,
          platformFee: 0,
        });

        setChartData({
          labels: [
            revData?.period || `${year}-${String(month).padStart(2, "0")}`,
          ],
          values: [
            revData?.revenue ??
              (revData?.revenueCents != null ? revData.revenueCents / 100 : 0),
          ],
        });

        const rows = Array.isArray(revData?.transactions)
          ? revData.transactions
          : [];

        const mappedRows = rows.map((tx) => {
          const amount =
            tx.amount != null
              ? tx.amount
              : tx.amountCents != null
              ? tx.amountCents / 100
              : 0;

          const rawDate = tx.createdAt;
          const formattedDate = rawDate
            ? rawDate.replace("T", " ").slice(0, 16)
            : "";

          return {
            id: tx.id,
            buyer: "-", // BE chưa trả learnerName
            teacher:
              revData?.teacherName || teacherData?.teacher?.displayName || "-",
            type: "Khóa học",
            item: tx.courseTitle || "-",
            amount,
            fee: 0,
            date: formattedDate,
            status: "COMPLETED",
          };
        });

        setTxList(mappedRows);
      } catch (err) {
        console.error(err);
        toast.error("Không tải được dữ liệu doanh thu, vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [teacherId, courseId]);

  // =========================
  // COLUMNS TABLE
  // =========================
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
            r.status === "COMPLETED" || r.status === "SUCCESS"
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

  const titleText = !teacherId
    ? "Tài chính - chọn giáo viên"
    : courseId
    ? "Doanh thu khóa học"
    : "Doanh thu giáo viên";

  return (
    <div className={s.page}>
      <h1 className={s.title}>{titleText}</h1>

      {/* Nếu chưa chọn teacher → show hướng dẫn, không call API */}
      {!teacherId && (
        <div className={s.emptyState}>
          <p>
            Vui lòng chọn một giáo viên từ trang{" "}
            <strong>&quot;Người dùng&quot;</strong> hoặc{" "}
            <strong>&quot;Chứng chỉ GV&quot;</strong> rồi chuyển tới
            <br />
            <code>/admin/revenue/&lt;teacherId&gt;</code> để xem doanh thu chi
            tiết.
          </p>
          <p style={{ marginTop: 8, fontSize: 13 }}>
            Ví dụ: <code>/admin/revenue/5</code> hoặc{" "}
            <code>/admin/revenue/5/140</code> để xem doanh thu của một khóa học.
          </p>
        </div>
      )}

      {teacherId && (
        <>
          {/* ===== SUMMARY CARDS ===== */}
          <div className={s.summaryGrid}>
            <SummaryCard
              icon={<AiOutlineMoneyCollect />}
              label="Tổng doanh thu"
              value={summary.totalRevenue.toLocaleString("vi-VN") + "₫"}
            />
            <SummaryCard
              icon={<FaShoppingCart />}
              label="Doanh thu tháng"
              value={summary.monthRevenue.toLocaleString("vi-VN") + "₫"}
            />
            <SummaryCard
              icon={<FaShoppingCart />}
              label="Giao dịch hoàn tất"
              value={summary.completedCount}
            />
            <SummaryCard
              icon={<AiOutlineMoneyCollect />}
              label="Phí nền tảng thu được"
              value={summary.platformFee.toLocaleString("vi-VN") + "₫"}
            />
          </div>

          {/* ===== CHART ===== */}
          <div className={s.chartCard}>
            <div className={s.chartHeader}>
              <h3>Biểu đồ doanh thu theo tháng</h3>
              {loading && <span className={s.loadingText}>Đang tải...</span>}
            </div>

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
            <DataTable columns={columns} data={txList} loading={loading} />
          </div>

          <DetailModal
            open={!!detailItem}
            data={detailItem}
            onClose={() => setDetailItem(null)}
          />
        </>
      )}
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
