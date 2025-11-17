import React from "react";
import styles from "./AnalysisResult.module.scss";

const AnalysisResult = ({ loading, error, data }) => {
  if (loading) return <div className={styles.loading}>Đang phân tích…</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return <div className={styles.placeholder}>Nhập câu và bấm phân tích.</div>;

  const info = data.data;

  return (
    <div className={styles.card}>
      <h3>Kết quả phân tích</h3>

      {/* Level */}
      <div className={styles.section}>
        <p className={styles.label}>Cấp độ câu:</p>
        <div className={styles.value}>{info.level}</div>
      </div>

      {/* Giải thích */}
      {info.explanation && (
        <div className={styles.section}>
          <p className={styles.label}>Giải thích tổng quan:</p>
          <div className={styles.block}>{info.explanation}</div>
        </div>
      )}

      {/* 2 cột lớn */}
      <div className={styles.grid}>
        {/* TỪ VỰNG */}
        <div className={styles.column}>
          <p className={styles.colTitle}>📘 Từ vựng</p>

          {info.vocabulary && info.vocabulary.length > 0 ? (
            <ul className={styles.list}>
              {info.vocabulary.map((word, i) => (
                <li key={i} className={styles.item}>{word}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>Không có từ vựng</p>
          )}
        </div>

        {/* NGỮ PHÁP */}
        <div className={styles.column}>
          <p className={styles.colTitle}>📙 Ngữ pháp</p>

          {info.grammar && info.grammar.length > 0 ? (
            <ul className={styles.list}>
              {info.grammar.map((gram, i) => (
                <li key={i} className={styles.item}>{gram}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>Không có ngữ pháp</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
