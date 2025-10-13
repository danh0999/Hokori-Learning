import React from "react";
import ProgressBar from "./ProgressBar";
import styles from "./UpcomingLessons.module.scss";

const UpcomingLessons = ({ items = [] }) => (
  <section className="card">
    <h3 className={styles.title}>Bài học sắp tới</h3>
    <div className={styles.list}>
      {items.length ? (
        items.map((i) => (
          <div className={styles.item} key={i.id}>
            <div className={styles.name}>{i.title}</div>
            <div className={styles.date}>
              Dự kiến: {new Date(i.scheduledAt).toLocaleDateString("vi-VN")}
            </div>
            <div className={styles.bar}>
              <ProgressBar value={i.progress} height={6} />
            </div>
          </div>
        ))
      ) : (
        <div className={styles.empty}>Không có bài học sắp tới.</div>
      )}
    </div>
  </section>
);

export default UpcomingLessons;
