// src/pages/AiConversationPage/components/ResultPanel.jsx
import React from "react";
import styles from "./ResultPanel.module.scss";

const norm = (v) => {
  if (v == null || Number.isNaN(Number(v))) return null;
  const n = Number(v);
  if (n <= 1) return Math.round(n * 100);
  if (n <= 100) return Math.round(n);
  return Math.round(n);
};

export default function ResultPanel({ result, onRestart }) {
  const evalObj = result?.evaluation || {};
  const overall = norm(evalObj?.overallScore);

  const renderScore = (label, val) => {
    const n = norm(val);
    return (
      <div className={styles.scoreRow}>
        <div className={styles.scoreHeader}>
          <span>{label}</span>
          <span>{n != null ? `${n}/100` : "--/100"}</span>
        </div>
        <div className={styles.bar}>
          <div className={styles.fill} style={{ width: n != null ? `${n}%` : 0 }} />
        </div>
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>Đánh giá sau hội thoại</h3>
        <button className={styles.btn} onClick={onRestart}>
          Trò chuyện lại
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.overall}>
          <div className={styles.circle}>{overall != null ? overall : "--"}</div>
          <div>
            <div className={styles.overallLabel}>Tổng điểm</div>
            <div className={styles.overallDesc}>Dựa trên chất lượng hội thoại tổng thể.</div>
          </div>
        </div>

        <div className={styles.grid}>
          {renderScore("Độ chính xác", evalObj?.accuracyScore)}
          {renderScore("Lưu loát", evalObj?.fluencyScore)}
          {renderScore("Ngữ pháp", evalObj?.grammarScore)}
          {renderScore("Từ vựng", evalObj?.vocabularyScore)}
        </div>

        <div className={styles.feedbackGrid}>
          <div className={styles.fbBlock}>
            <div className={styles.fbTitle}>Điểm tốt</div>
            <ul>
              {(evalObj?.strengths || []).map((x, i) => (
                <li key={`s-${i}`}>{x}</li>
              ))}
            </ul>
          </div>

          <div className={styles.fbBlock}>
            <div className={styles.fbTitle}>Cần cải thiện</div>
            <ul>
              {(evalObj?.improvements || []).map((x, i) => (
                <li key={`i-${i}`}>{x}</li>
              ))}
            </ul>
          </div>

          <div className={styles.fbBlock}>
            <div className={styles.fbTitle}>Gợi ý luyện tập</div>
            <ul>
              {(evalObj?.suggestions || []).map((x, i) => (
                <li key={`g-${i}`}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.convCard}>
        <div className={styles.convTitle}>Toàn bộ hội thoại</div>
        <div className={styles.convList}>
          {(result?.fullConversation || []).map((m, idx) => {
            const isUser = String(m.role).toUpperCase() === "USER";
            return (
              <div key={`${m.role}-${idx}`} className={`${styles.convItem} ${isUser ? styles.user : styles.ai}`}>
                <div className={styles.convRole}>{isUser ? "Bạn" : "AI"}</div>
                <div className={styles.convJp}>{m.text || "—"}</div>
                <div className={styles.convVi}>{m.textVi || ""}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
