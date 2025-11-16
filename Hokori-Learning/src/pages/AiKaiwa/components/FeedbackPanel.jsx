import React from "react";
import { useSelector } from "react-redux";
import styles from "./FeedbackPanel.module.scss";

const FeedbackPanel = () => {
  const {
    loading,
    error,
    overallScore,
    pronunciationScore,
    accuracyScore,
    fluencyScore,
    feedback,
    userTranscript,
    targetText,
  } = useSelector((state) => state.aiSpeech);

  const renderBar = (label, val) => (
    <div className={styles.subItem}>
      <div className={styles.subHeader}>
        <span>{label}</span>
        <span>{val != null ? `${val}/100` : "--/100"}</span>
      </div>
      <div className={styles.subBar}>
        <div
          className={styles.subFill}
          style={{ width: val != null ? `${val}%` : 0 }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>Phản hồi AI</h3>

      {loading && <p>AI đang phân tích...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {overallScore != null && !loading && (
        <>
          <div className={styles.scoreBox}>
            <span className={styles.totalScore}>{overallScore}</span>
            <p>Tổng điểm phát âm</p>
          </div>

          <div className={styles.subscores}>
            {renderBar("Phát âm", pronunciationScore)}
            {renderBar("Độ chính xác", accuracyScore)}
            {renderBar("Độ trôi chảy", fluencyScore)}
          </div>

          <div className={styles.box}>
            <h4 className={styles.subTitle}>Câu bạn đọc</h4>
            <p className={styles.transcript}>{userTranscript || "--"}</p>

            <h4 className={styles.subTitle}>Câu mẫu</h4>
            <p className={styles.sample}>{targetText || "--"}</p>

            <h4 className={styles.subTitle}>Nhận xét của AI</h4>
            <p className={styles.feedback}>
              {feedback || "Không có phản hồi chi tiết."}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default FeedbackPanel;
