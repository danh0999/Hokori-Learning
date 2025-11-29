// src/pages/QuizPage/components/SubmitModal.jsx
import React from "react";
import styles from "./SubmitModal.module.scss";

const SubmitModal = ({
  open,
  loading,
  result,
  totalQuestions,
  answeredCount,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;

  const hasResult = !!result;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        {!hasResult ? (
          <>
            <h2>Xác nhận nộp bài</h2>
            <p>
              Bạn đã trả lời {answeredCount}/{totalQuestions} câu.
              <br />
              Bạn có chắc chắn muốn nộp bài không?
            </p>
            <div className={styles.actions}>
              <button onClick={onCancel} className={styles.cancelBtn}>
                Làm tiếp
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? "Đang nộp..." : "Nộp bài"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Kết quả bài làm</h2>
            <p>
              Điểm số: <strong>{result.score ?? result.totalScore ?? "N/A"}</strong>
            </p>
            {typeof result.correctCount === "number" && (
              <p>
                Đúng {result.correctCount}/{totalQuestions} câu
              </p>
            )}
            {typeof result.pass === "boolean" && (
              <p>
                Trạng thái:{" "}
                <strong
                  className={
                    result.pass ? styles.pass : styles.notPass
                  }
                >
                  {result.pass ? "Đạt" : "Chưa đạt"}
                </strong>
              </p>
            )}

            <div className={styles.actions}>
              <button onClick={onCancel} className={styles.submitBtn}>
                Đóng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SubmitModal;
