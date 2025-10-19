import React from "react";
import styles from "./OrderSummary.module.scss";

const OrderSummary = ({ courses }) => {
  const total = courses.reduce((sum, c) => sum + c.price, 0);
  const discount = 650000;
  const final = total - discount;

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
          <span className={styles.discount}>-₫{discount.toLocaleString()}</span>
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
          <input placeholder="Nhập mã giảm giá" />
          <button>Áp dụng</button>
        </div>
      </div>

      <button className={styles.checkout}>Tiến hành thanh toán</button>
    </div>
  );
};

export default OrderSummary;
