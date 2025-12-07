// src/pages/PaymentResult/PaymentResultPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../configs/axios";
import styles from "./PaymentResultPage.module.scss";

const POLL_INTERVAL = 3000; // 3s
const MAX_POLL = 10; // ~30s

export default function PaymentResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const orderCode = new URLSearchParams(location.search).get("orderCode");

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);

  const pollCountRef = useRef(0);
  const timerRef = useRef(null);

  /* ============================
     FETCH PAYMENT STATUS
  ============================ */
  const fetchStatus = async () => {
    try {
      const res = await api.get(
        `/payment/order/${orderCode}`
      );

      setPayment(res.data);
      setLoading(false);

      if (res.data.status === "PENDING") {
        if (pollCountRef.current < MAX_POLL) {
          pollCountRef.current += 1;
          timerRef.current = setTimeout(fetchStatus, POLL_INTERVAL);
        }
      }
    } catch (err) {
      setError("Không thể kiểm tra trạng thái thanh toán");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderCode) {
      setError("Thiếu mã đơn hàng");
      setLoading(false);
      return;
    }

    fetchStatus();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderCode]);

  /* ============================
     RETRY ENROLLMENT
  ============================ */
  const handleRetryEnrollment = async () => {
    try {
      await api.post(
        `/payment/${payment.paymentId}/retry-enrollment`
      );
      fetchStatus();
    } catch (err) {
      alert("Không thể xử lý lại đăng ký khóa học");
    }
  };

  /* ============================
     RENDER STATES
  ============================ */

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.card}>
          <h2>Đang xác nhận thanh toán...</h2>
          <p>Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.center}>
        <div className={styles.card}>
          <h2>Lỗi</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/")}>Về trang chủ</button>
        </div>
      </div>
    );
  }

  /* ============================
     STATUS UI
  ============================ */

  const { status, courses = [], amount, paidAt } = payment;

  return (
    <div className={styles.center}>
      <div className={styles.card}>
        {/* ICON */}
        {status === "PAID" && <div className={styles.success}>✓</div>}
        {(status === "FAILED" || status === "EXPIRED") && (
          <div className={styles.fail}>!</div>
        )}

        {/* TITLE */}
        {status === "PAID" && <h1>Thanh toán thành công</h1>}
        {status === "FAILED" && <h1>Thanh toán thất bại</h1>}
        {status === "EXPIRED" && <h1>Giao dịch đã hết hạn</h1>}
        {status === "PENDING" && <h1>Đang xử lý thanh toán</h1>}

        {/* DESCRIPTION */}
        {status === "PAID" && (
          <p>Các khóa học đã được thêm vào tài khoản của bạn.</p>
        )}
        {status !== "PAID" && (
          <p>Bạn có thể quay lại giỏ hàng để thử lại.</p>
        )}

        {/* ORDER INFO */}
        {status === "PAID" && (
          <div className={styles.summary}>
            <p>
              <strong>Tổng tiền:</strong>{" "}
              {(amount / 100).toLocaleString("vi-VN")}đ
            </p>
            <p>
              <strong>Thời gian:</strong>{" "}
              {paidAt ? new Date(paidAt).toLocaleString() : ""}
            </p>

            <div className={styles.courseList}>
              {courses.map((c) => (
                <div key={c.courseId} className={styles.course}>
                  {c.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className={styles.actions}>
          {status === "PAID" && (
            <button onClick={() => navigate("/my-courses")}>
              Vào khóa học của tôi
            </button>
          )}

          {(status === "FAILED" || status === "EXPIRED") && (
            <button onClick={() => navigate("/cart")}>
              Quay lại giỏ hàng
            </button>
          )}

          <button
            className={styles.secondary}
            onClick={() => navigate("/")}
          >
            Trang chủ
          </button>
        </div>

        {/* RETRY ENROLLMENT */}
        {status === "PAID" && courses.length === 0 && (
          <button
            className={styles.retry}
            onClick={handleRetryEnrollment}
          >
            Thử lại việc đăng ký khóa học
          </button>
        )}
      </div>
    </div>
  );
}
