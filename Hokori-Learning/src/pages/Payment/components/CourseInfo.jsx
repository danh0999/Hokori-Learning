import React from "react";
import styles from "../PaymentPage.module.scss";

export default function CourseInfo({ courses, total }) {
  if (!courses || courses.length === 0)
    return <div className={styles.card}>Không có khóa học.</div>;

  return (
    <div className={styles.leftCol}>
      <div className={styles.card}>
        <h2>Khóa học của bạn</h2>

        {courses.map((c, i) => (
          <div key={i} className={styles.courseItem}>
            <div>
              <h3>{c.title}</h3>
              
            </div>
            <span className={styles.price}>
              ₫{c.price.toLocaleString("vi-VN")}
            </span>
          </div>
        ))}

        <div className={styles.divider}>
          <div className={styles.row}>
            <span className={styles.totalLabel}>Tổng tiền:</span>
            <span className={styles.totalPrice}>
              ₫{total.toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
