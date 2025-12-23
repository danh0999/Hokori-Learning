// ===============================================
// FeedbackPanel.jsx — BẢN CHUẨN THEO BACKEND
// (CHỈ FIX ĐIỂM + THÊM FLUENCY)
// ===============================================

import React from "react";
import styles from "./FeedbackPanel.module.scss";

/* =========================
   Helpers
========================= */
const normalizeScore = (val) => {
  if (val == null || isNaN(val)) return null;
  if (val <= 1) return Math.round(val * 100);
  if (val <= 100) return Math.round(val);
  return Math.round(val);
};

const parseActionableFeedback = (text = "") => {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
};

/* =========================
   Component
========================= */
const FeedbackPanel = ({ loading, error, result }) => {
  /* =========================
     LOADING / ERROR / EMPTY
  ========================= */
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

  /* =========================
     DATA (FROM BACKEND)
  ========================= */
  const {
    pronunciationScore,
    accuracyScore,
    confidence,      // ⬅️ fluency
    overallScore,    // ⬅️ tổng điểm backend
    userTranscript,
    targetText,
    feedback,
  } = result || {};

  const pron = normalizeScore(pronunciationScore);
  const acc = normalizeScore(accuracyScore);
  const fluency = normalizeScore(confidence);
  const total = normalizeScore(overallScore);

  const wordDifferences =
    feedback?.comparison?.wordDifferences || [];

  const actionableFeedbackLines = parseActionableFeedback(
    feedback?.actionableFeedback
  );

  const errorCount = wordDifferences.length;

  /* =========================
     Render helpers
  ========================= */
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

  const renderWordDifferences = () => {
    if (!wordDifferences.length) return null;

    return (
      <div className={styles.wordDiffBox}>
        <div className={styles.title}>
          ⚠️ Các từ cần sửa ({errorCount})
        </div>

        <ul className={styles.wordDiffList}>
          {wordDifferences.map((w, idx) => (
            <li key={idx} className={styles.wordDiffItem}>
              <div className={styles.wordCompare}>
                <span className={styles.expected}>
                  Đúng: {w.expected || "∅"}
                </span>
                <span className={styles.actual}>
                  Bạn nói: {w.actual || "∅"}
                </span>
              </div>
              <div className={styles.wordSuggestion}>
                {w.suggestion}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderActionableFeedback = () => {
    if (!actionableFeedbackLines.length) return null;

    return (
      <div className={styles.actionableBox}>
        <div className={styles.title}>🎯 Hướng dẫn sửa cụ thể</div>
        <ul className={styles.actionableList}>
          {actionableFeedbackLines.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      </div>
    );
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <section className={styles.panel}>
      <h3 className={styles.heading}>Phản hồi AI</h3>

      {/* Tổng điểm (BACKEND) */}
      <div className={styles.scoreCircle}>
        {total != null ? total : "--"}
      </div>
      <p className={styles.totalLabel}>Tổng điểm phát âm</p>

      {/* Điểm chi tiết */}
      {renderBar("Phát âm", pron)}
      {renderBar("Độ chính xác", acc)}
      {renderBar("Độ trôi chảy", fluency)}

      {/* Transcript */}
      <div className={styles.textBlock}>
        <div className={styles.title}>Câu bạn đọc</div>
        <p className={styles.detail}>{userTranscript || "--"}</p>
      </div>

      {/* Target */}
      <div className={styles.textBlock}>
        <div className={styles.title}>Câu mẫu</div>
        <p className={`${styles.detail} ${styles.target}`}>
          {targetText || "--"}
        </p>
      </div>

      {/* Overall feedback (GIỮ NGUYÊN BACKEND) */}
      <div className={styles.textBlock}>
        <div className={styles.title}>Nhận xét của AI</div>
        <p className={`${styles.detail} ${styles.feedbackText}`}>
          {feedback?.overallFeedbackVi ||
            feedback?.overallFeedback ||
            "Chưa có phản hồi chi tiết."}
        </p>
      </div>

      {/* Word-level errors (MD) */}
      {renderWordDifferences()}

      {/* Actionable feedback (MD) */}
      {renderActionableFeedback()}
    </section>
  );
};

export default FeedbackPanel;
