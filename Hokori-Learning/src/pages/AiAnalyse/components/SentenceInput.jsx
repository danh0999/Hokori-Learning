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
  
}) => {
  const len = sentence?.length || 0;

  return (
    <div className={styles.card}>
      <h3>Câu cần phân tích</h3>

      <textarea
        value={sentence}
        onChange={(e) => onChangeSentence(e.target.value)}
        placeholder="VD: 私は日本語を勉強しています"
      />

      <div className={styles.charCount}>{len}/50 ký tự</div>

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
        

          <button className={styles.primaryBtn} onClick={onAnalyse}>
            Phân tích với AI
          </button>
        </div>
      </div>
    </div>
  );
};

export default SentenceInput;
