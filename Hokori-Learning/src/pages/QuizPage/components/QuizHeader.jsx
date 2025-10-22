import React from "react";
import styles from "./QuizHeader.module.scss";

const QuizHeader = ({ quiz }) => {
  return (
    <header className={styles.header}>
      <h1>{quiz?.title || "Tên bài Quiz"}</h1>
      <div className={styles.right}>
        <span className={styles.timer}>
          ⏱ {quiz?.duration || "00:00"}
        </span>
        <button className={styles.submitBtn}>Nộp bài</button>
      </div>
    </header>
  );
};

export default QuizHeader;
