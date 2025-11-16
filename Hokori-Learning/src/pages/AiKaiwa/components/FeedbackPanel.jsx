import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styles from "./FeedbackPanel.module.scss";

const FeedbackPanel = () => {
  const { loading, error, overallScore, pronunciation, intonation, fluency } =
    useSelector((state) => state.aiSpeech);

  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (typeof overallScore === "number") {
      let val = 0;
      const step = Math.max(1, Math.floor(overallScore / 30));
      const timer = setInterval(() => {
        val += step;
        if (val >= overallScore) {
          val = overallScore;
          clearInterval(timer);
        }
        setAnimatedScore(val);
      }, 25);
      return () => clearInterval(timer);
    } else setAnimatedScore(0);
  }, [overallScore]);

  const circleR = 60;
  const circleC = 2 * Math.PI * circleR;
  const progress =
    typeof overallScore === "number"
      ? circleC * (1 - overallScore / 100)
      : circleC;

  const renderSub = (label, val) => (
    <div className={styles.feedbackPanel_subItem}>
      <div className={styles.feedbackPanel_subHeader}>
        <span>{label}</span>
        <span>{val != null ? `${val}/100` : "--/100"}</span>
      </div>
      <div className={styles.feedbackPanel_subBar}>
        <div
          className={styles.feedbackPanel_subFill}
          style={{ width: val != null ? `${val}%` : "0%" }}
        />
      </div>
    </div>
  );

  return (
    <div className={styles.feedbackPanel_root}>
      <div className={styles.feedbackPanel_header}>
        <div className={styles.feedbackPanel_headerLeft}>
          <i className="fa-solid fa-robot" />
          <span className={styles.feedbackPanel_title}>Phản hồi của AI</span>
        </div>
        <div className={styles.feedbackPanel_infoIcon}>
          <i className="fa-solid fa-circle-info" />
          <div className={styles.feedbackPanel_tooltip}>
            Đánh giá được tạo tự động bằng AI Hokori Kaiwa.
          </div>
        </div>
      </div>

      <div className={styles.feedbackPanel_scoreBox}>
        <div className={styles.feedbackPanel_circle}>
          <svg>
            <circle
              className={styles.feedbackPanel_bgCircle}
              cx="72"
              cy="72"
              r={circleR}
            />
            <circle
              className={styles.feedbackPanel_fgCircle}
              cx="72"
              cy="72"
              r={circleR}
              strokeDasharray={circleC}
              strokeDashoffset={progress}
            />
          </svg>
          <div className={styles.feedbackPanel_scoreValue}>
            {overallScore != null ? animatedScore : "--"}
            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>điểm</span>
          </div>
        </div>
        <p className={styles.feedbackPanel_label}>Tổng điểm phát âm</p>
      </div>

      <div className={styles.feedbackPanel_subscores}>
        {renderSub("Phát âm", pronunciation)}
        {renderSub("Ngữ điệu", intonation)}
        {renderSub("Trôi chảy", fluency)}
      </div>

      <div className={styles.feedbackPanel_box}>
        {loading ? (
          <p className={styles.feedbackPanel_loading}>AI đang phân tích dữ liệu...</p>
        ) : error ? (
          <p style={{ color: "#dc2626" }}>{error}</p>
        ) : overallScore != null ? (
          <>
            <div className={styles.feedbackPanel_iconText}>
              <i className="fa-solid fa-lightbulb" />
              <span>Nhận xét chi tiết</span>
            </div>
            <p>
              Điểm số phản ánh mức độ tự nhiên của giọng nói. Hãy luyện tập thêm để
              cải thiện phát âm.
            </p>
          </>
        ) : (
          <>
            <div className={styles.feedbackPanel_iconText}>
              <i className="fa-solid fa-lightbulb" />
              <span>Nhận xét chi tiết</span>
            </div>
            <p>
              Hãy ghi âm để nhận phản hồi chi tiết từ AI về phát âm, ngữ điệu và độ trôi
              chảy của bạn.
            </p>
          </>
        )}
      </div>

      <p className={styles.feedbackPanel_hint}>
        Bạn có thể luyện lại nhiều lần để cải thiện phát âm.
      </p>
    </div>
  );
};

export default FeedbackPanel;
