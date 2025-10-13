import React from "react";
import { FaBook, FaGlobe } from "react-icons/fa";
import styles from "./CompletedLessons.module.scss";

const iconMap = {
  book: <FaBook />,
  language: <FaGlobe />,
};

const formatDate = (isoLike) =>
  new Date(isoLike).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const CompletedLessons = ({ lessons = [], onViewAll }) => {
  return (
    <section className="card">
      <div className={styles.header}>
        <h2>Bài học đã hoàn thành</h2>
        <button className={styles.linkBtn} onClick={onViewAll}>Xem tất cả</button>
      </div>

      <div className={styles.list}>
        {lessons.map((l) => (
          <div key={l.id} className={styles.item}>
            <div className={styles.iconWrap}>{iconMap[l.icon] || <FaBook />}</div>
            <div className={styles.meta}>
              <div className={styles.title}>{l.title}</div>
              <div className={styles.date}>Hoàn thành: {formatDate(l.completedAt)}</div>
            </div>
            <div className={styles.doneMark}>✓</div>
          </div>
        ))}
        {lessons.length === 0 && <div className={styles.empty}>Chưa có bài học nào.</div>}
      </div>
    </section>
  );
};

export default CompletedLessons;
