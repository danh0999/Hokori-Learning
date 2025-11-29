// src/pages/QuizPage/components/QuizHeader.jsx
import React from "react";
import styles from "./QuizHeader.module.scss";

const formatTime = (sec) => {
  if (sec == null) return "--:--";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const QuizHeader = ({ title, totalQuestions, answeredCount, timeLeft, onSubmit }) => {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title || "Bài Quiz"}</h1>
        <p className={styles.meta}>
          {answeredCount}/{totalQuestions} câu đã trả lời
        </p>
      </div>

      <div className={styles.right}>
        <div className={styles.timer}>
          <span>Thời gian còn lại:</span>
          <strong>{formatTime(timeLeft)}</strong>
        </div>
        <button className={styles.submitBtn} onClick={onSubmit}>
          Nộp bài
        </button>
      </div>
    </header>
  );
};

export default QuizHeader;
