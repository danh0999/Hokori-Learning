import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./OrderSummary.module.scss";
import { checkout } from "../../../services/paymentService";

const OrderSummary = ({ courses, cartId }) => {
  const navigate = useNavigate();                    

  const total = courses.reduce((sum, c) => sum + c.price, 0);
  const [discount, setDiscount] = useState(0);
  const [code, setCode] = useState("");

  const handleApply = () => {
    if (code.trim().toUpperCase() === "HOKORI10") {
      setDiscount(total * 0.1);
    } else {
      setDiscount(0);
      alert("Mã giảm giá không hợp lệ!");
    }
  };

  const final = total - discount;

  const handleCheckout = async () => {
    if (courses.length === 0) {
      alert("Giỏ hàng trống!");
      return;
    }

    try {
      // Chỉ thanh toán các item đang được chọn
      const selectedIds = courses
        .filter((c) => c.selected)
        .map((c) => c.id);

      if (selectedIds.length === 0) {
        alert("Vui lòng chọn khóa học để thanh toán");
        return;
      }

      // Gọi API checkout theo đặc tả .md
      const result = await checkout(cartId, selectedIds);

      const link = result?.data?.paymentLink || null;
      const desc = result?.data?.description || "";

      if (link === null) {
        alert("Đăng ký thành công! " + desc);
        navigate("/my-courses");
      } else {
        window.location.href = link;
      }
    } catch (err) {
      const msg = err?.message || "Không thể khởi tạo thanh toán";
      alert(msg);
    }
  };

  return (
    <div className={styles.summary}>
      <h3>Tổng đơn hàng</h3>

      <div className={styles.pricing}>
        <div>
          <span>Tổng giá trị ({courses.length} khóa học)</span>
          <span>₫{total.toLocaleString()}</span>
        </div>

        <div>
          <span>Giảm giá</span>
          <span className={styles.discount}>
            -₫{discount.toLocaleString()}
          </span>
        </div>

        <hr />

        <div className={styles.total}>
          <span>Tổng thanh toán</span>
          <span>₫{final.toLocaleString()}</span>
        </div>
      </div>

      <div className={styles.coupon}>
        <label>Mã giảm giá</label>
        <div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Nhập mã giảm giá"
          />
          <button onClick={handleApply}>Áp dụng</button>
        </div>
      </div>

      <button className={styles.checkout} onClick={handleCheckout}>
        Tiến hành thanh toán
      </button>
    </div>
  );
};

export default OrderSummary;
