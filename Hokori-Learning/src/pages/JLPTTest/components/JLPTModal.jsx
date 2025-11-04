// JLPTModal.jsx
import React from "react";
import styles from "./JLPTModal.module.scss";

const JLPTModal = ({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {message && <p className={styles.message}>{message}</p>}

        <div className={styles.actions}>
          {onCancel && (
            <button className={styles.cancelBtn} onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          {onConfirm && (
            <button className={styles.confirmBtn} onClick={onConfirm}>
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JLPTModal;
