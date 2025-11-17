// src/pages/AiAnalysePage/components/SentenceInput.jsx
import React from "react";
import styles from "./SentenceInput.module.scss";

const JLPT = ["N5", "N4", "N3", "N2", "N1"];

const SentenceInput = ({
  sentence,
  onChangeSentence,
  level,
  onChangeLevel,
  onAnalyse
}) => {
  return (
    <div className={styles.leftCard}>
      <h3>Câu cần phân tích</h3>

      <textarea
        value={sentence}
        onChange={(e) => onChangeSentence(e.target.value)}
        placeholder="VD: 私は日本語を勉強しています"
      />

      <div className={styles.row}>
        <div className={styles.col}>
          <label>Cấp độ JLPT</label>
          <select value={level} onChange={(e) => onChangeLevel(e.target.value)}>
            {JLPT.map((jlpt) => (
              <option key={jlpt}>{jlpt}</option>
            ))}
          </select>
        </div>

        <button className={styles.analyseBtn} onClick={onAnalyse}>
          Phân tích câu với AI
        </button>
      </div>
    </div>
  );
};

export default SentenceInput;
