import React, { useState } from "react";
import styles from "./SubmitModal.module.scss";

const SubmitModal = () => {
  const [open, setOpen] = useState(false);
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Xác nhận nộp bài</h3>
        <p>Bạn chắc chắn muốn nộp bài không?</p>
        <div className={styles.actions}>
          <button onClick={() => setOpen(false)} className={styles.cancel}>
            Hủy
          </button>
          <button className={styles.submit}>Nộp bài</button>
        </div>
      </div>
    </div>
  );
};

export default SubmitModal;
