// src/pages/LearnerDashboard/components/QuizResults.jsx
import React from "react";
import { FaChartLine } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import styles from "./QuizResults.module.scss";

const QuizResults = ({ results = [], onViewAll }) => {
  const navigate = useNavigate();

  const handleClick = (item) => {
    // cần cả testId và attemptId
    if (!item?.testId || !item?.id) return;
    navigate(`/jlpt/test/${item.testId}/review?attemptId=${item.id}`);
  };

  return (
    <section className="card">
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Kết quả kiểm tra gần đây</h3>

        {onViewAll && (
          <button
            type="button"
            className={styles.viewAllBtn}
            onClick={onViewAll}
          >
            Xem tất cả
          </button>
        )}
      </div>

      <div className={styles.list}>
        {results.length ? (
          results.map((r) => (
            <div
              key={r.id}
              className={styles.item}
              onClick={() => handleClick(r)}
            >
              <div className={styles.left}>
                <div className={styles.icon}>
                  <FaChartLine />
                </div>

                <div>
                  <div className={styles.name}>{r.title}</div>
                  <div className={styles.date}>
                    {r.takenAt
                      ? new Date(r.takenAt).toLocaleDateString("vi-VN")
                      : "—"}
                  </div>
                </div>
              </div>

              <div className={styles.right}>
                <div className={styles.scoreBlock}>
                  <span className={styles.scoreValue}>{r.score}đ</span>
                  <span className={styles.scoreLabel}>Tổng điểm</span>
                </div>

                <div className={styles.detailBlock}>
                  <span className={styles.detailTop}>{r.correct}</span>
                  <span className={styles.detailLabel}>Câu đúng</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.empty}>Chưa có bài kiểm tra.</div>
        )}
      </div>
    </section>
  );
};

export default QuizResults;
