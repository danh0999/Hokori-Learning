import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./OrderSummary.module.scss";
import { checkout } from "../../../services/paymentService";

const OrderSummary = ({ courses = [], cartId }) => {
  const navigate = useNavigate();

  // Chỉ tính các item đang selected
  const selectedCourses = useMemo(
    () => courses.filter((c) => c.selected),
    [courses]
  );

  const subtotal = useMemo(
    () =>
      selectedCourses.reduce((sum, c) => {
        const price = Number(c.price) || 0; // đã là tổng tiền của dòng
        return sum + price;
      }, 0),
    [selectedCourses]
  );

  const [code, setCode] = useState("");
  const [discountRate, setDiscountRate] = useState(0); // ví dụ 0.1 = 10%
  const [isSubmitting, setIsSubmitting] = useState(false);

  const discount = subtotal * discountRate;
  const finalTotal = Math.max(subtotal - discount, 0);

  const handleApply = () => {
    const normalized = code.trim().toUpperCase();

    if (!normalized) {
      setDiscountRate(0);
      return;
    }

    if (normalized === "HOKORI10") {
      setDiscountRate(0.1);
      alert("Áp dụng mã giảm giá 10% thành công!");
    } else {
      setDiscountRate(0);
      alert("Mã giảm giá không hợp lệ.");
    }
  };

  const handleCheckout = async () => {
    if (!selectedCourses.length) {
      alert("Vui lòng chọn ít nhất 1 khoá học để thanh toán.");
      return;
    }

    if (!cartId) {
      alert("Giỏ hàng không hợp lệ, vui lòng tải lại trang.");
      return;
    }

    const selectedIds = selectedCourses.map((c) => c.id);

    try {
      setIsSubmitting(true);

      const result = await checkout(cartId, selectedIds);
      // API spec: { success, message, data: { paymentLink, description, ... } }
      const paymentData = result?.data || {};
      const paymentLink =
        paymentData.paymentLink ?? result?.paymentLink ?? null;

      // Nếu không có paymentLink → BE đã tự enroll & clear cart (khóa học free chẳng hạn)
      if (!paymentLink) {
        alert(
          result?.message ||
            "Thanh toán thành công, bạn sẽ được chuyển tới khoá học."
        );
        navigate("/my-courses");
        return;
      }

      // Có link PayOS → redirect sang PayOS
      window.location.href = paymentLink;
    } catch (err) {
      console.error("Checkout error:", err);
      alert(err.message || "Không thể tạo thanh toán, vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.summary}>
      <h2>Tóm tắt thanh toán</h2>

      <div className={styles.row}>
        <span>Số khoá học được chọn</span>
        <span>{selectedCourses.length}</span>
      </div>

      <div className={styles.row}>
        <span>Tạm tính</span>
        <span>₫{subtotal.toLocaleString()}</span>
      </div>

      <div className={styles.row}>
        <span>Giảm giá</span>
        <span>- ₫{discount.toLocaleString()}</span>
      </div>

      <div className={`${styles.row} ${styles.totalRow}`}>
        <span>Thành tiền</span>
        <span>₫{finalTotal.toLocaleString()}</span>
      </div>

      <div className={styles.coupon}>
        <label htmlFor="coupon">Mã giảm giá</label>
        <div className={styles.couponInput}>
          <input
            id="coupon"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Nhập mã giảm giá (ví dụ: HOKORI10)"
          />
          <button type="button" onClick={handleApply}>
            Áp dụng
          </button>
        </div>
      </div>

      <button
        type="button"
        className={styles.checkout}
        onClick={handleCheckout}
        disabled={isSubmitting || !selectedCourses.length}
      >
        {isSubmitting ? "Đang tạo thanh toán..." : "Tiến hành thanh toán"}
      </button>
    </div>
  );
};

export default OrderSummary;
