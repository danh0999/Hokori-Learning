import React from "react";
import styles from "./ActionBar.module.scss";

const ActionBar = ({ current }) => {
  // 📌 sau này gắn logic: markComplete, nextLesson, prevLesson
  return (
    <div className={styles.actions}>
      <button className={styles.secondary}>Previous</button>
      <button className={styles.primary}>Mark Complete</button>
      <button className={styles.secondary}>Next</button>
    </div>
  );
};

export default ActionBar;
