// src/pages/QuizPage/components/Sidebar.jsx
import React from "react";
import styles from "./Sidebar.module.scss";

const Sidebar = ({
  total,
  activeIndex,
  answers,
  questions,
  onSelectQuestion,
}) => {
  if (!questions || questions.length === 0) return null;

  return (
    <div className={styles.sidebar}>
      <h3 className={styles.title}>Câu hỏi</h3>
      <div className={styles.grid}>
        {questions.map((q, idx) => {
          const isAnswered = answers && answers[q.questionId] != null;
          const isActive = idx === activeIndex;

          return (
            <button
              key={q.questionId}
              type="button"
              className={`${styles.number} ${
                isActive ? styles.active : ""
              } ${isAnswered ? styles.answered : ""}`}
              onClick={() => onSelectQuestion(idx)}
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
