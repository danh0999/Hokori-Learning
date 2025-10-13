import React from "react";
import { FaCheckCircle, FaPlayCircle, FaClock } from "react-icons/fa";
import ProgressBar from "./ProgressBar";
import styles from "./ProgressTracker.module.scss";

const icon = (s) => {
  const st = s.toLowerCase();
  if (st.includes("hoàn")) return <FaCheckCircle />;
  if (st.includes("đang")) return <FaPlayCircle />;
  return <FaClock />;
};

const ProgressTracker = ({ overall = 0, jlptLevels = [] }) => (
  <section className="card">
    <h2 className={styles.title}>Tiến độ học tập</h2>
    <div className={styles.overall}>
      <div className={styles.row}>
        <span>Tiến độ tổng thể</span>
        <span>{overall}%</span>
      </div>
      <ProgressBar value={overall} height={12} />
    </div>

    <div className={styles.list}>
      {jlptLevels.map((lv) => (
        <div className={styles.item} key={lv.level}>
          <div className={styles.left}>
            {icon(lv.status)}
            <span>{lv.level}</span>
          </div>
          <div className={styles.right}>
            {lv.progress > 0 ? (
              <>
                <ProgressBar value={lv.progress} height={8} />
                <span>{lv.progress}%</span>
              </>
            ) : (
              <span>{lv.status}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default ProgressTracker;
