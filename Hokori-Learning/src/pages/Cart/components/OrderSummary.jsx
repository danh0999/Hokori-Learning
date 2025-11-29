import React, { useState } from "react";
import { useNavigate } from "react-router-dom";      
import styles from "./OrderSummary.module.scss";

const OrderSummary = ({ courses }) => {
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

  const handleCheckout = () => {
    if (courses.length === 0) {
      alert("Giỏ hàng trống!");
      return;
    }

    // LƯU ĐƠN HÀNG TẠM để trang Payment lấy lại
    localStorage.setItem(
      "pendingOrder",
      JSON.stringify({
        items: courses,
        total,
        discount,
        final,
      })
    );

    // ĐIỀU HƯỚNG SANG TRANG THANH TOÁN
    navigate("/payment");     
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
