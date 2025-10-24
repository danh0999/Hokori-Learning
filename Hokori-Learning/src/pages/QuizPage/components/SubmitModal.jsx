// SubmitModal.jsx
import React from "react";
import styles from "./SubmitModal.module.scss";

const SubmitModal = ({ data, onClose, onConfirm }) => {
  if (!data) return null;

  const isWarn = data.type === "warn";
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {isWarn ? (
          <>
            <h3>Bạn chưa hoàn thành bài làm!</h3>
            <p>Một số câu hỏi vẫn chưa được trả lời. Bạn có chắc chắn muốn nộp không?</p>
            <div className={styles.actions}>
              <button onClick={onClose} className={styles.cancel}>Hủy</button>
              <button onClick={onConfirm} className={styles.submit}>Vẫn nộp</button>
            </div>
          </>
        ) : (
          <>
            <h3> Hoàn thành bài thi!</h3>
            <p>
              Điểm của bạn: <strong>{data.score.correct}</strong> / {data.score.total} ({data.score.percent}%)
            </p>
            <div className={styles.actions}>
              <button onClick={onClose} className={styles.submit}>Đóng</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SubmitModal;
