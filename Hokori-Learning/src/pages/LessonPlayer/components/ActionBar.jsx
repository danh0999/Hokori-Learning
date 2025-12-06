import React from "react";
import styles from "./ActionBar.module.scss";
import { updateContentProgress } from "../../../services/learningProgressService";

const ActionBar = ({ primaryContentId }) => {
  const handleMarkComplete = () => {
    if (!primaryContentId) return;

    updateContentProgress(primaryContentId, {
      isCompleted: true,
    }).catch(() => {});
  };

  return (
    <div className={styles.actions}>
      <button className={styles.secondary}>Bài trước</button>
      <button
        className={styles.primary}
        onClick={handleMarkComplete}
      >
        Đánh dấu hoàn thành
      </button>
      <button className={styles.secondary}>Bài tiếp theo</button>
    </div>
  );
};

export default ActionBar;
