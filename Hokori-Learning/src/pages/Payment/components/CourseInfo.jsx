import React from "react";
import styles from "../PaymentPage.module.scss";

export default function CourseInfo({ course }) {
  const data = course || {
    title: "Khóa học Tiếng Nhật cơ bản N5",
    level: "N5 - Sơ cấp",
    badge: "N5",
    duration: "12 tuần",
    startDate: "15/02/2025",
    sessions: 36,
    price: 1200000,
    benefits: [
      "36 bài học trực tuyến với giáo viên",
      "Tài liệu học tập đầy đủ",
      "Bài tập và kiểm tra định kỳ",
      "Chứng chỉ hoàn thành khóa học",
    ],
  };

  return (
    <div className={styles.leftCol}>
      <div className={styles.card}>
        <h2>Thông tin khóa học</h2>
        <div className={styles.courseHeader}>
          <div>
            <h3>{data.title}</h3>
            <p>Cấp độ: {data.level}</p>
          </div>
          <span className={styles.badge}>{data.badge}</span>
        </div>

        <div className={styles.divider}>
          <div className={styles.row}>
            <span>Thời lượng:</span>
            <span>{data.duration}</span>
          </div>
          <div className={styles.row}>
            <span>Ngày bắt đầu:</span>
            <span>{data.startDate}</span>
          </div>
          <div className={styles.row}>
            <span>Số buổi học:</span>
            <span>{data.sessions} buổi</span>
          </div>
        </div>

        <div className={styles.divider}>
          <div className={styles.row}>
            <span className={styles.totalLabel}>Tổng tiền:</span>
            <span className={styles.totalPrice}>
              {data.price.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3>Bạn sẽ nhận được:</h3>
        <ul className={styles.benefits}>
          {data.benefits.map((b, i) => (
            <li key={i}>
              <i className="fa-solid fa-check"></i>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
