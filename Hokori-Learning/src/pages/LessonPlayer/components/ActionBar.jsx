import React from "react";
import styles from "./ActionBar.module.scss";


const ActionBar = ({ onPrev, onNext, onComplete }) => {
  return (
    <div className={styles.actions}>
      <button className={styles.secondary} onClick={onPrev}>
        Bài trước
      </button>

      <button className={styles.primary} onClick={onComplete}>
        Đánh dấu hoàn thành
      </button>

      <button className={styles.secondary} onClick={onNext}>
        Bài tiếp theo
      </button>
    </div>
  );
};


export default ActionBar;
