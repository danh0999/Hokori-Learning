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
    transcript,
    targetText,
  } = useSelector((state) => state.aiSpeech || {});

  const effectiveTranscript = userTranscript || transcript || "";

  const renderBar = (label, val) => (
    <div className={styles.barItem} key={label}>
      <div className={styles.barHeader}>
        <span>{label}</span>
        <span>{val != null ? `${val}/100` : "--/100"}</span>
      </div>
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{ width: val != null ? `${val}%` : 0 }}
        />
      </div>
    </div>
  );

  const hasScore = overallScore != null && !loading;

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <span className={styles.dot} />
        <h3 className={styles.title}>Phản hồi của AI</h3>
      </header>

      {loading && <p className={styles.helper}>AI đang phân tích giọng nói...</p>}

      {error && (
        <div className={styles.errorBox}>
          <p>{error}</p>
        </div>
      )}

      {hasScore ? (
        <>
          <div className={styles.scoreRow}>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreValue}>{overallScore}</span>
              <span className={styles.scoreUnit}>điểm</span>
            </div>
            <p className={styles.scoreCaption}>Tổng điểm phát âm</p>
          </div>

          <div className={styles.barGroup}>
            {renderBar("Phát âm", pronunciationScore)}
            {renderBar("Độ chính xác", accuracyScore)}
            {renderBar("Độ trôi chảy", fluencyScore)}
          </div>

          <div className={styles.detailCard}>
            <h4 className={styles.detailTitle}>Câu bạn vừa đọc</h4>
            <p className={styles.textLine}>
              {effectiveTranscript || "Chưa có nội dung nhận diện."}
            </p>

            <h4 className={styles.detailTitle}>Câu mẫu</h4>
            <p className={styles.textLine}>
              {targetText || "Chưa có câu mẫu."}
            </p>

            <h4 className={styles.detailTitle}>Nhận xét chi tiết</h4>
            <p className={styles.textLine}>
              {feedback || "Không có phản hồi chi tiết."}
            </p>
          </div>

          <p className={styles.footerNote}>
            Bạn có thể luyện lại nhiều lần để cải thiện phát âm và nhịp điệu.
          </p>
        </>
      ) : (
        !loading &&
        !error && (
          <p className={styles.helper}>
            Hãy ghi âm một câu nói của bạn. AI sẽ phân tích và phản hồi chi tiết ở đây.
          </p>
        )
      )}
    </section>
  );
};

export default FeedbackPanel;
