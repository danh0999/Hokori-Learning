// src/pages/AiAnalysePage/components/SentenceInput.jsx
import React from "react";
import styles from "./SentenceInput.module.scss";

const JLPT = ["N5", "N4", "N3", "N2", "N1"];

const SentenceInput = ({
  sentence,
  onChangeSentence,
  level,
  onChangeLevel,
  onAnalyse,
  onRandom,
}) => {
  const len = sentence?.length || 0;
  const overLimit = len > 50;

  return (
    <div className={styles.card}>
      <h3>Câu cần phân tích</h3>

      <p className={styles.helperText}>
        Bạn có thể nhập <strong>câu tiếng Nhật</strong> hoặc{" "}
        <strong>câu tiếng Việt</strong>. Nếu nhập tiếng Việt, hệ thống sẽ dịch
        sang tiếng Nhật để phân tích; nếu nhập tiếng Nhật, hệ thống sẽ dịch
        sang tiếng Việt để bạn dễ hiểu.
      </p>

      <textarea
        value={sentence}
        onChange={(e) => onChangeSentence(e.target.value)}
        placeholder="VD: 私は日本語を勉強しています hoặc Tôi đang học tiếng Nhật"
        maxLength={50}
      />

      <div
        className={`${styles.charCount} ${
          overLimit ? styles.charCountError : ""
        }`}
      >
        {len}/50 ký tự
      </div>

      <div className={styles.row}>
        <div className={styles.col}>
          <label>JLPT</label>
          <select value={level} onChange={(e) => onChangeLevel(e.target.value)}>
            {JLPT.map((lv) => (
              <option key={lv}>{lv}</option>
            ))}
          </select>
        </div>

        <div className={styles.buttons}>
          {onRandom && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onRandom}
            >
              Gợi ý câu theo level
            </button>
          )}

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onAnalyse}
          >
            Phân tích với AI
          </button>
        </div>
      </div>
    </div>
  );
};

export default SentenceInput;
