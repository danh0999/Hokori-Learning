// src/pages/QuizPage/components/Sidebar.jsx
import React from "react";
import styles from "./Sidebar.module.scss";

const Sidebar = ({ total, activeIndex, answers, questions, onSelectQuestion }) => {
  if (!total) return null;

  return (
    <div className={styles.sidebar}>
      <h3 className={styles.title}>Câu hỏi</h3>
      <div className={styles.grid}>
        {Array.from({ length: total }).map((_, idx) => {
          const fetched = idx < (questions?.length || 0);
          const q = fetched ? questions[idx] : null;
          const isAnswered = q && answers && answers[q.questionId] != null;
          const isActive = idx === activeIndex;

          return (
            <button
              key={q?.questionId || `placeholder-${idx}`}
              type="button"
              className={`${styles.number} ${isActive ? styles.active : ""} ${
                isAnswered ? styles.answered : ""
              }`}
              onClick={() => fetched && onSelectQuestion(idx)}
              disabled={!fetched}
              title={fetched ? `Đi tới câu ${idx + 1}` : "Chưa tải câu hỏi"}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
      <p className={styles.legend}>
        <span className={styles.dotAnswered}></span> Đã trả lời
      </p>
    </div>
  );
};

export default Sidebar;
