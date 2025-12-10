// src/pages/QuizPage/components/SubmitModal.jsx
import React from "react";
import styles from "./SubmitModal.module.scss";

const SubmitModal = ({
  open,
  loading,
  result,
  totalQuestions,
  answeredCount,
  onCancel,  // Hàm này giờ sẽ kiêm chức năng "Quay về" khi đã có kết quả
  onConfirm,
}) => {
  if (!open) return null;

  const hasResult = !!result;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        {!hasResult ? (
          // --- TRẠNG THÁI 1: XÁC NHẬN NỘP BÀI ---
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
          // --- TRẠNG THÁI 2: HIỂN THỊ KẾT QUẢ ---
          <>
            <h2 style={{ color: '#166534' }}>Kết quả bài làm</h2>
            
            <div className={styles.resultBox}>
                <p>
                  Điểm số: <strong style={{ fontSize: '24px', color: '#2563eb' }}>{result.scorePercent ?? 0} / 100</strong>
                </p>
                {/* Check nếu có trường correctCount thì hiển thị */}
                {(result.correctCount !== undefined) && (
                  <p>
                    Số câu đúng: <strong>{result.correctCount}/{totalQuestions}</strong>
                  </p>
                )}
                {/* Check nếu có trường pass (đậu/rớt) */}
                {(result.pass !== undefined) && (
                  <p>
                    Trạng thái:{" "}
                    <span
                      className={
                        result.pass ? styles.pass : styles.notPass
                      }
                      style={{ fontWeight: 'bold' }}
                    >
                      {result.pass ? "ĐẠT" : "CHƯA ĐẠT"}
                    </span>
                  </p>
                )}
            </div>

            <div className={styles.actions}>
              {/* Nút này sẽ gọi handleCloseModal ở trang cha -> navigate về bài học */}
              <button onClick={onCancel} className={styles.submitBtn}>
                Quay về bài học
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SubmitModal;