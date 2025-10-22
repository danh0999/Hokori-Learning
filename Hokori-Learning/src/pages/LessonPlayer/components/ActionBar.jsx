import React from "react";
import styles from "./ActionBar.module.scss";

const ActionBar = ({ current }) => {
  // 📌 sau này gắn logic: markComplete, nextLesson, prevLesson
  return (
    <div className={styles.actions}>
      <button className={styles.secondary}>Bài trước</button>
      <button className={styles.primary}>Đánh dấu hoàn thành</button>
      <button className={styles.secondary}>Bài tiếp theo</button>
    </div>
  );
};

export default ActionBar;
