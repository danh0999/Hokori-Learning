// src/pages/JLPTEventTests/components/TestCard.jsx
import React from "react";
import styles from "./TestCard.module.scss";
import { IoMdTime } from "react-icons/io";
import { MdOutlineScore } from "react-icons/md";

const TestCard = ({ test, onStart }) => {
  const { title, level, durationMin, totalScore, resultNote } = test;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>{title}</h3>
        {level && <span className={styles.levelTag}>{level}</span>}
      </div>

      {resultNote && <p className={styles.desc}>{resultNote}</p>}

      <div className={styles.infoGroup}>
        <div className={styles.infoItem}>
          <IoMdTime />
          <span>Thời gian: {durationMin} phút</span>
        </div>

        <div className={styles.infoItem}>
          <MdOutlineScore />
          <span>Tổng điểm: {totalScore}</span>
        </div>
      </div>

      <button className={styles.actionBtn} onClick={onStart}>
        Bắt đầu thi thử
      </button>
    </div>
  );
};

export default TestCard;
