// src/pages/JLPTEventTests/components/TestCard.jsx
import React from "react";
import styles from "./TestCard.module.scss";
import { IoMdTime } from "react-icons/io";

import { MdPeople } from "react-icons/md";
import { MdCreditScore } from "react-icons/md";
const TestCard = ({ test, onStart }) => {
  const {
    title,
    level,
    durationMin,
    totalScore,
    
    currentParticipants,
  } = test;

  return (
    <div className={styles.card}>
      {/* HEADER */}
      <div className={styles.header}>
        <h3>{title}</h3>
        {level && <span className={styles.levelTag}>{level}</span>}
      </div>

      {/* INFO */}
      <div className={styles.infoGroup}>
        <div className={styles.infoItem}>
          <IoMdTime />
          <span>Thời gian: {durationMin} phút</span>
        </div>

        <div className={styles.infoItem}>
          <MdCreditScore />
          <span>Tổng điểm: {totalScore}</span>
        </div>

        {typeof currentParticipants === "number" && (
          <div className={styles.infoItem}>
            <MdPeople />
            <span>Số người đã tham gia: {currentParticipants}</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <button className={styles.actionBtn} onClick={onStart}>
        Bắt đầu thi thử
      </button>
    </div>
  );
};

export default TestCard;
