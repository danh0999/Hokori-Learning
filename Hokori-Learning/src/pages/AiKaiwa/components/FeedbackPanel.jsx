// ===============================================
// FeedbackPanel.jsx — BẢN CHUẨN CHỈNH ĐIỂM MỚI
// ===============================================

import React from "react";
import styles from "./FeedbackPanel.module.scss";

const normalizeScore = (val) => {
  if (val == null || isNaN(val)) return null;
  if (val <= 1) return Math.round(val * 100);
  if (val <= 100) return Math.round(val);
  return Math.round(val);
};

const FeedbackPanel = ({ loading, error, result }) => {
  if (loading) {
    return (
      <section className={styles.panel}>
        <h3 className={styles.heading}>Phản hồi AI</h3>
        <p>AI đang phân tích giọng nói của bạn...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.panel}>
        <h3 className={styles.heading}>Phản hồi AI</h3>
        <p className={styles.error}>❌ {error}</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className={styles.panel}>
        <h3 className={styles.heading}>Phản hồi AI</h3>
        <p>Hãy ghi âm và bấm luyện tập để nhận phản hồi.</p>
      </section>
    );
  }

  const {
    pronunciationScore,
    accuracyScore,
    userTranscript,
    targetText,
    feedback,
  } = result;

  // CHUẨN HÓA ĐIỂM
  const pron = normalizeScore(pronunciationScore);
  const acc = normalizeScore(accuracyScore);

  // ===============================================
  // TÍNH LẠI TỔNG ĐIỂM (BỎ FLUENCY)
  // 60% Pronunciation + 40% Accuracy
  // ===============================================
  const total =
    pron != null && acc != null
      ? Math.round(pron * 0.6 + acc * 0.4)
      : null;

  const renderBar = (label, value) => {
    const v = normalizeScore(value);
    return (
      <div className={styles.subRow}>
        <div className={styles.subHeader}>
          <span>{label}</span>
          <span>{v != null ? `${v}/100` : "--/100"}</span>
        </div>
        <div className={styles.bar}>
          <div
            className={styles.fill}
            style={{ width: v != null ? `${v}%` : 0 }}
          />
        </div>
      </div>
    );
  };

  return (
    <section className={styles.panel}>
      <h3 className={styles.heading}>Phản hồi AI</h3>

      {/* Tổng điểm */}
      <div className={styles.scoreCircle}>
        {total != null ? total : "--"}
      </div>
      <p className={styles.totalLabel}>Tổng điểm phát âm</p>

      {/* Các điểm con */}
      {renderBar("Phát âm", pron)}
      {renderBar("Độ chính xác", acc)}

      {/* Transcript người dùng */}
      <div className={styles.textBlock}>
        <div className={styles.title}>Câu bạn đọc</div>
        <p className={styles.detail}>{userTranscript || "--"}</p>
      </div>

      {/* Target text */}
      <div className={styles.textBlock}>
        <div className={styles.title}>Câu mẫu</div>
        <p className={`${styles.detail} ${styles.target}`}>
          {targetText || "--"}
        </p>
      </div>

      {/* Feedback AI */}
      <div className={styles.textBlock}>
        <div className={styles.title}>Nhận xét của AI</div>
        <p className={`${styles.detail} ${styles.feedbackText}`}>
          {feedback?.overallFeedbackVi ||
            feedback?.overallFeedback ||
            feedback ||
            "Chưa có phản hồi chi tiết."}
        </p>
      </div>
    </section>
  );
};

export default FeedbackPanel;
