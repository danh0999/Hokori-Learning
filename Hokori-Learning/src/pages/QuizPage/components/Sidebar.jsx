import React from "react";
import styles from "./Sidebar.module.scss";

const Sidebar = ({ total = 5, current = 0, answers = {}, onSelectQuestion }) => {
  return (
    <div className={styles.sidebar}>
      <h3>Danh sách câu hỏi</h3>
      <div className={styles.grid}>
        {Array.from({ length: total }, (_, i) => {
          const answered = answers[i + 1];
          return (
            <button
              key={i}
              className={`${styles.navBtn} 
                ${i === current ? styles.current : ""} 
                ${answered ? styles.answered : ""}`}
              onClick={() => onSelectQuestion(i)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
