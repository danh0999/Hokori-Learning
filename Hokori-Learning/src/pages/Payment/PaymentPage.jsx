import React from "react";
import styles from "./PaymentPage.module.scss";
import CourseInfo from "./components/CourseInfo";
import PaymentForm from "./components/PaymentForm";

export default function PaymentPage({ course, onSubmit }) {
  return (
    <main className={styles.payment}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Thanh toán khóa học Tiếng Nhật N5</h1>
          <p>Hoàn tất thông tin để bắt đầu hành trình học tập cùng Hokori</p>
        </div>

        <div className={styles.grid}>
          <CourseInfo course={course} />
          <PaymentForm onSubmit={onSubmit} />
        </div>
      </div>
    </main>
  );
}
