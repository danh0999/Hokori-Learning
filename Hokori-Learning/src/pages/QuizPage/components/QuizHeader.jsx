
import React from "react";
import styles from "./QuizHeader.module.scss";

const QuizHeader = ({ quiz, timeLeft, onSubmit }) => {
  return (
    <header className={styles.header}>
      <h1>{quiz?.title || "Tên bài Quiz"}</h1>
      <div className={styles.right}>
        <span className={styles.timer}>
          ⏱ Thời gian còn lại: <strong>{timeLeft}</strong>
        </span>
        <button className={styles.submitBtn} onClick={onSubmit}>
          Nộp bài
        </button>
      </div>
    </header>
  );
};

export default QuizHeader;
