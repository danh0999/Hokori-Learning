// QuizHeader.jsx
import React from "react";
import { createPortal } from "react-dom";
import styles from "./QuizHeader.module.scss";

const QuizHeader = ({ quiz, timeLeft }) => {
  const headerEl = (
    <header className={styles.header}>
      <h1>{quiz?.title || "Tên bài Quiz"}</h1>
      <div className={styles.right}>
        <span className={styles.timer}>
          ⏱ Thời gian còn lại: <strong>{timeLeft}</strong>
        </span>
        <button className={styles.submitBtn}>Nộp bài</button>
      </div>
    </header>
  );

  // Render ra <body> để tránh ảnh hưởng bởi overflow/transform của ancestor
  return createPortal(headerEl, document.body);
};

export default QuizHeader;
