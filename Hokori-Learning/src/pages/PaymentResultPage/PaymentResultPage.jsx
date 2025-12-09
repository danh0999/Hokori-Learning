// src/pages/Payment/PaymentResultPage.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { getPaymentByOrderCode } from "../../services/paymentService";
import { fetchCart } from "../../redux/features/cartSlice";
import styles from "./PaymentResultPage.module.scss";

const STATUS_LABELS = {
  PENDING: "Đang chờ thanh toán",
  PAID: "Thanh toán thành công",
  CANCELLED: "Đã hủy thanh toán",
  FAILED: "Thanh toán thất bại",
  EXPIRED: "Thanh toán đã hết hạn",
};

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const orderCode = searchParams.get("orderCode");
  const statusFromQuery = (searchParams.get("status") || "").toUpperCase();

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);
  const [finalStatus, setFinalStatus] = useState(statusFromQuery || "PENDING");

  // === Helper: check success ===
  const isSuccess = finalStatus === "PAID";

  useEffect(() => {
    if (!orderCode) {
      setLoading(false);
      setError("Thiếu mã đơn hàng (orderCode) trong URL.");
      return;
    }

    const fetchData = async () => {
      try {
        const data = await getPaymentByOrderCode(orderCode);
        setPayment(data);

        // Ưu tiên status từ BE, fallback về status trong query
        const status = (
          data?.status ||
          statusFromQuery ||
          "PENDING"
        ).toUpperCase();
        setFinalStatus(status);

        // ✅ Nếu đã thanh toán thành công thì fetch lại cart
        // BE đã xử lý clear các item được thanh toán & enroll vào My Courses
        if (status === "PAID") {
          dispatch(fetchCart());
        }
      } catch (err) {
        setError(err.message || "Không thể tải thông tin thanh toán");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderCode, statusFromQuery, dispatch]);

  // ====== UI ======

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <h2>Đang kiểm tra trạng thái thanh toán...</h2>
          <p>Vui lòng chờ trong giây lát.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <div className={`${styles.card} ${styles.failed}`}>
          <h2>Không thể xác nhận thanh toán</h2>
          <p>{error}</p>
          <div className={styles.actions}>
            <button onClick={() => navigate("/cart")}>Quay lại giỏ hàng</button>
            <button onClick={() => navigate("/")}>Về trang chủ</button>
          </div>
        </div>
      </div>
    );
  }

  // Bằng đoạn này:
  const rawAmount = payment?.amountCents || 0;
  // Nếu BE dùng đơn vị khác (ví dụ đã là VND rồi) thì bỏ chia /100 đi
  const amountVnd = Math.round(rawAmount / 100);

  // Format theo kiểu (2.000)
  const formattedAmount = `(${amountVnd.toLocaleString("vi-VN")})`;

  const statusLabel = STATUS_LABELS[finalStatus] || finalStatus;

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.card} ${
          isSuccess ? styles.success : styles.failed
        }`}
      >
        <h2>
          {isSuccess ? "Thanh toán thành công!" : "Thanh toán không thành công"}
        </h2>

        <p className={styles.status}>
          Trạng thái: <strong>{statusLabel}</strong>
        </p>

        <div className={styles.info}>
          <div>
            <span>Mã đơn hàng (orderCode)</span>
            <strong>{payment?.orderCode || orderCode}</strong>
          </div>

          <div>
            <span>Số tiền</span>
            <strong>{formattedAmount}</strong>
          </div>

          {payment?.description && (
            <div>
              <span>Ghi chú</span>
              <p>{payment.description}</p>
            </div>
          )}

          {Array.isArray(payment?.courses) && payment.courses.length > 0 && (
            <div>
              <span>Khoá học đã thanh toán</span>
              <ul>
                {payment.courses.map((course) => (
                  <li key={course.id}>{course.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {isSuccess ? (
            <>
              <button onClick={() => navigate("/my-courses")}>
                Hoàn tất & tới khóa học của tôi
              </button>
              <button onClick={() => navigate("/")}>Về trang chủ</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/cart")}>
                Quay lại giỏ hàng
              </button>
              <button onClick={() => navigate("/")}>Về trang chủ</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;
