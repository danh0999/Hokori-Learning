import React from "react";
import { FaCheckCircle, FaPlayCircle, FaClock } from "react-icons/fa";
import ProgressBar from "./ProgressBar";
import styles from "./ProgressTracker.module.scss";

/**
 * ProgressTracker — thẻ tiến độ tổng thể cho Learner Dashboard
 *
 * Props:
 *  - overall: số % tổng thể (0–100)
 *  - jlptLevels: mảng các cấp JLPT [{ level: "N5", progress: 60, status: "Đang học" }]
 */
const ProgressTracker = ({ overall = 0, jlptLevels = [] }) => {
  const icon = (status = "") => {
    const s = status.toLowerCase();
    if (s.includes("hoàn")) return <FaCheckCircle color="#16a34a" />;
    if (s.includes("đang")) return <FaPlayCircle color="#2563eb" />;
    return <FaClock color="#6b7280" />;
  };

  return (
    <section className={`${styles.trackerCard} card`}>
      {/* Tiến độ tổng thể */}
      <h3 className={styles.title}>Tiến độ học tập</h3>

      <div className={styles.overall}>
        <ProgressBar
          value={overall}
          label="Tổng thể"
          size="lg"
          striped
          animated
        />
      </div>

      {/* Danh sách cấp độ JLPT */}
      <div className={styles.list}>
        {jlptLevels.map((lv) => (
          <div className={styles.item} key={lv.level}>
            <div className={styles.left}>
              {icon(lv.status)}
              <span className={styles.level}>{lv.level}</span>
            </div>

            <div className={styles.right}>
              {lv.progress > 0 ? (
                <ProgressBar
                  value={lv.progress}
                  size="sm"
                  showPercent
                  label={null}
                />
              ) : (
                <span className={styles.status}>{lv.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProgressTracker;
