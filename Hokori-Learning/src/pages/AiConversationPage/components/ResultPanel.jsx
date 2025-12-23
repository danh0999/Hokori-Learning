// src/pages/AiConversationPage/components/ResultPanel.jsx
import React, { useMemo, useState } from "react";
import styles from "./ResultPanel.module.scss";

const norm = (v) => {
  if (v == null || Number.isNaN(Number(v))) return null;
  const n = Number(v);
  if (n <= 1) return Math.round(n * 100);
  if (n <= 100) return Math.round(n);
  return Math.round(n);
};

const pickList = (obj, viKey, fallbackKey) => {
  const a = obj?.[viKey];
  if (Array.isArray(a) && a.length) return a;
  const b = obj?.[fallbackKey];
  if (Array.isArray(b) && b.length) return b;
  return [];
};

export default function ResultPanel({ result, onRestart }) {
  const evalObj = result?.evaluation || {};
  const overall = norm(evalObj?.overallScore);

  const summary = evalObj?.summaryVi || evalObj?.summary || "";
  const overallFeedback =
    evalObj?.overallFeedbackVi || evalObj?.overallFeedback || "";

  const strengths = pickList(evalObj, "strengthsVi", "strengths");
  const improvements = pickList(evalObj, "improvementsVi", "improvements");
  const suggestions = pickList(evalObj, "suggestionsVi", "suggestions");

  const detailed = useMemo(() => {
    const arr = evalObj?.detailedAnalysisVi || evalObj?.detailedAnalysis || [];
    return Array.isArray(arr) ? arr : [];
  }, [evalObj]);

  const renderScore = (label, val) => {
    const n = norm(val);
    return (
      <div className={styles.scoreRow}>
        <div className={styles.scoreHeader}>
          <span>{label}</span>
          <span>{n != null ? `${n}/100` : "--/100"}</span>
        </div>
        <div className={styles.bar}>
          <div
            className={styles.fill}
            style={{ width: n != null ? `${n}%` : 0 }}
          />
        </div>
      </div>
    );
  };

  // simple accordion state
  const [openTurn, setOpenTurn] = useState(null);

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
            <div className={styles.overallDesc}>
              Dựa trên chất lượng hội thoại tổng thể.
            </div>
          </div>
        </div>

        {/* NEW: Summary nhanh */}
        {summary ? (
          <div className={styles.summaryBox}>
            <div className={styles.summaryTitle}>Tóm tắt nhanh</div>
            <div className={styles.summaryText}>{summary}</div>
          </div>
        ) : null}

        <div className={styles.grid}>
          {renderScore("Độ chính xác", evalObj?.accuracyScore)}
          {renderScore("Lưu loát", evalObj?.fluencyScore)}
          {renderScore("Ngữ pháp", evalObj?.grammarScore)}
          {renderScore("Từ vựng", evalObj?.vocabularyScore)}
        </div>

        {/* NEW: Overall feedback chi tiết */}
        {overallFeedback ? (
          <div className={styles.overallFeedbackBox}>
            <div className={styles.overallFeedbackTitle}>Nhận xét tổng quan</div>
            <div className={styles.overallFeedbackText}>{overallFeedback}</div>
          </div>
        ) : null}

        <div className={styles.feedbackGrid}>
          <div className={styles.fbBlock}>
            <div className={styles.fbTitle}>Điểm tốt</div>
            <ul>
              {strengths.length ? strengths.map((x, i) => <li key={`s-${i}`}>{x}</li>) : <li>—</li>}
            </ul>
          </div>

          <div className={styles.fbBlock}>
            <div className={styles.fbTitle}>Cần cải thiện</div>
            <ul>
              {improvements.length ? improvements.map((x, i) => <li key={`i-${i}`}>{x}</li>) : <li>—</li>}
            </ul>
          </div>

          <div className={styles.fbBlock}>
            <div className={styles.fbTitle}>Gợi ý luyện tập</div>
            <ul>
              {suggestions.length ? suggestions.map((x, i) => <li key={`g-${i}`}>{x}</li>) : <li>—</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Detailed analysis */}
      {detailed.length ? (
        <div className={styles.detailCard}>
          <div className={styles.detailTitle}>Phân tích chi tiết từng lượt</div>

          <div className={styles.detailList}>
            {detailed.map((d, idx) => {
              const turn = d?.turn ?? idx + 1;
              const isOpen = openTurn === turn;

              const errors = Array.isArray(d?.errors) ? d.errors : [];
              const corrections = Array.isArray(d?.corrections) ? d.corrections : [];

              return (
                <div key={`turn-${turn}`} className={styles.detailItem}>
                  <button
                    className={styles.detailHeader}
                    onClick={() => setOpenTurn(isOpen ? null : turn)}
                  >
                    <span>Lượt {turn}</span>
                    <span className={styles.detailToggle}>{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen ? (
                    <div className={styles.detailBody}>
                      <div className={styles.detailRow}>
                        <div className={styles.detailLabel}>Câu bạn nói</div>
                        <div className={styles.detailValue}>{d?.userResponse || "—"}</div>
                      </div>

                      <div className={styles.detailRow}>
                        <div className={styles.detailLabel}>Lỗi</div>
                        <div className={styles.detailValue}>
                          {errors.length ? (
                            <ul>{errors.map((e, i) => <li key={`e-${turn}-${i}`}>{e}</li>)}</ul>
                          ) : (
                            "Không có"
                          )}
                        </div>
                      </div>

                      <div className={styles.detailRow}>
                        <div className={styles.detailLabel}>Cách sửa</div>
                        <div className={styles.detailValue}>
                          {corrections.length ? (
                            <ul>{corrections.map((c, i) => <li key={`c-${turn}-${i}`}>{c}</li>)}</ul>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>

                      <div className={styles.detailRow}>
                        <div className={styles.detailLabel}>Câu tốt hơn</div>
                        <div className={styles.detailValue}>{d?.betterResponse || "—"}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className={styles.convCard}>
        <div className={styles.convTitle}>Toàn bộ hội thoại</div>
        <div className={styles.convList}>
          {(result?.fullConversation || []).map((m, idx) => {
            const role = String(m.role || "").toLowerCase();
            const isUser = role === "user";
            return (
              <div
                key={`${m.role}-${idx}`}
                className={`${styles.convItem} ${isUser ? styles.user : styles.ai}`}
              >
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
