// QuizHeader.jsx
import React from "react";
import { createPortal } from "react-dom";
import styles from "./QuizHeader.module.scss";

const QuizHeader = ({ quiz, timeLeft, onSubmit }) => {
  const headerEl = (
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

  // (Có thể giữ portal hoặc render trực tiếp — portal giúp tránh overflow cha)
  return createPortal(headerEl, document.body);
};

export default QuizHeader;
