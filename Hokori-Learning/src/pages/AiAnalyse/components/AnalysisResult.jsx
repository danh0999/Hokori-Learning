// src/pages/AiAnalysePage/components/AnalysisResult.jsx
import React from "react";
import styles from "./AnalysisResult.module.scss";

import { FaBook, FaCode, FaSitemap, FaLightbulb } from "react-icons/fa6";

const AnalysisResult = ({ loading, error, data }) => {
  /* LOADING */
  if (loading)
    return (
      <div className={styles.loading}>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
      </div>
    );

  /* ERROR */
  if (error) return <div className={`${styles.state} ${styles.error}`}>{error}</div>;

  /* EMPTY */
  if (!data)
    return <div className={styles.state}>Nhập câu & bấm phân tích để xem kết quả.</div>;

  const { sentence, level, vocabulary, grammar, sentenceBreakdown, relatedSentences } = data;

  return (
    <div className={styles.fadeIn}>
      <div className={styles.card}>

        {/* Header */}
        <div className={styles.header}>
          <h3>Kết quả phân tích</h3>
        </div>

        {/* Sentence */}
        <div className={styles.sentenceBox}>{sentence}</div>
        <span className={styles.levelTag}>{level}</span>

        {/* Vocabulary */}
        <Section
          title="Từ vựng"
          icon={<FaBook />}
          items={vocabulary}
          type="vocab"
        />

        {/* Grammar */}
        <Section
          title="Ngữ pháp"
          icon={<FaCode />}
          items={grammar}
          type="grammar"
        />

        {/* Breakdown */}
        {sentenceBreakdown && (
          <div className={styles.breakdownCard}>
            <div className={styles.sectionHeader}>
              <FaSitemap className={styles.sectionIcon} />
              <h4>Cấu trúc câu</h4>
            </div>

            <p><strong>Chủ ngữ:</strong> {sentenceBreakdown.subject}</p>
            <p><strong>Tân ngữ:</strong> {sentenceBreakdown.object}</p>
            <p><strong>Động từ:</strong> {sentenceBreakdown.predicate}</p>

            {sentenceBreakdown.explanationVi && (
              <p className={styles.explain}>{sentenceBreakdown.explanationVi}</p>
            )}
          </div>
        )}

        {/* Related */}
        {relatedSentences?.length > 0 && (
          <div className={styles.relatedCard}>
            <div className={styles.sectionHeader}>
              <FaLightbulb className={styles.sectionIcon} />
              <h4>Các câu liên quan</h4>
            </div>

            <div className={styles.relatedGrid}>
              {relatedSentences.map((s, i) => (
                <div
                  key={i}
                  className={`${styles.relatedItem} ${styles.blockAnim}`}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

/* SECTION COMPONENT */
const Section = ({ title, icon, items, type }) => (
  <div className={styles.sectionCard}>
    <div className={styles.sectionHeader}>
      {icon}
      <h4>{title}</h4>
    </div>

    <div className={styles.twoColumn}>
      {items?.map((item, i) => (
        <div
          key={i}
          className={`${styles.blockItem} ${styles.blockAnim}`}
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <div className={styles.blockTitle}>
            {type === "vocab"
              ? `${item.word}（${item.reading}）`
              : item.pattern}
          </div>

          <div className={styles.blockContent}>
            {/* VOCAB */}
            {type === "vocab" && (
              <>
                <p><strong>Nghĩa:</strong> {item.meaningVi}</p>
                <p><strong>JLPT:</strong> {item.jlptLevel}</p>

                {item.examples && (
                  <ul>
                    {item.examples.map((ex, j) => (
                      <li key={j}>{ex}</li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {/* GRAMMAR */}
            {type === "grammar" && (
              <>
                <p><strong>Giải thích:</strong> {item.explanationVi}</p>
                {item.example && (
                  <p><strong>Ví dụ:</strong> {item.example}</p>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AnalysisResult;
