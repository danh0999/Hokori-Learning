import React from "react";
import styles from "./QuickActions.module.scss";

const QuickActions = ({ lessonId }) => {
  const items = ["Tệp đính kèm", "Quiz nhanh", "Flashcard", "Ghi chú của tôi"];
  return (
    <div className={styles.quickGrid}>
      {items.map((label) => (
        <button key={label} className={styles.card}>
          {label}
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
