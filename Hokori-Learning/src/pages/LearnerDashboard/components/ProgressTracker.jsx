// src/pages/LearnerDashboard/components/ProgressTracker.jsx
import React from "react";
import { FaBookOpen, FaChevronRight } from "react-icons/fa";
import ProgressBar from "./ProgressBar"; // Giả sử bạn tái sử dụng component này
import styles from "./ProgressTracker.module.scss";
import { useNavigate } from "react-router-dom";

const ProgressTracker = ({ courses = [], incompleteCount = 0 }) => {
  const navigate = useNavigate();

  return (
    <section className={styles.trackerCard}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Tiến độ học tập</h3>
      </div>

      {/* Dòng thông báo số lượng chưa hoàn thành */}
      <div className={styles.summaryText}>
        {incompleteCount > 0 ? (
          <>
            Bạn có <span className={styles.highlight}>{incompleteCount}</span>{" "}
            khóa học chưa hoàn thành
          </>
        ) : (
          "Bạn đã hoàn thành tất cả các khóa học!"
        )}
      </div>

      {/* Danh sách 3 khóa học gần nhất */}
      <div className={styles.list}>
        {courses.length === 0 ? (
          <p className={styles.empty}>Chưa có dữ liệu khóa học.</p>
        ) : (
          courses.map((course) => (
            <div
              key={course.courseId}
              className={styles.item}
              onClick={() => navigate("/my-courses")} // Hoặc navigate vào chi tiết
            >
              <div className={styles.left}>
                <div className={styles.iconBox}>
                  <FaBookOpen />
                </div>
                <div className={styles.info}>
                  <div className={styles.courseTitle}>{course.title}</div>
                  <span className={styles.levelBadge}>{course.level}</span>
                </div>
              </div>

              <div className={styles.right}>
                <ProgressBar
                  value={course.progress}
                  size="sm"
                  showPercent={true}
                  label={null}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Nút xem tất cả */}
      <div className={styles.footer}>
        <button
          className={styles.viewAllBtn}
          onClick={() => navigate("/my-courses")}
        >
          Xem tất cả <FaChevronRight />
        </button>
      </div>
    </section>
  );
};

export default ProgressTracker;