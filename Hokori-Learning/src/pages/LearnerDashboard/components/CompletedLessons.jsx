// src/pages/LearnerDashboard/components/CompletedLessons.jsx
import React from "react";
import styles from "./CompletedLessons.module.scss";
import { FaAward, FaChevronRight, FaCheckCircle } from "react-icons/fa";

const CompletedLessons = ({ courses = [], onViewCertificate, onViewAll }) => {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>Bài học đã hoàn thành</h3>
        <button className={styles.viewAll} onClick={onViewAll}>
          Xem tất cả
        </button>
      </div>

      {courses.length === 0 ? (
        <p className={styles.empty}>Chưa có bài học nào hoàn thành.</p>
      ) : (
        <div className={styles.list}>
          {courses.map((course) => (
            <div key={course.courseId} className={styles.card}>
              <div className={styles.infoLeft}>
                <div className={styles.iconBox}>
                  <FaCheckCircle />
                </div>
                <div className={styles.textInfo}>
                  <div className={styles.courseName}>{course.title}</div>
                  <div className={styles.meta}>
                    <span className={styles.level}>{course.level}</span>
                    <span className={styles.completedText}>Hoàn thành 100%</span>
                  </div>
                </div>
              </div>

              <div className={styles.actionRight}>
                <button
                  className={styles.certBtn}
                  onClick={() => onViewCertificate(course.courseId)}
                  title="Xem chứng chỉ"
                >
                  <FaAward className={styles.btnIcon} />
                  <span>Xem chi tiết chứng chỉ</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default CompletedLessons;