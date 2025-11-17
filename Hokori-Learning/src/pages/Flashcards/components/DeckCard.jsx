import React from "react";
import styles from "./DeckCard.module.scss";

const DeckCard = ({ deck, onStudy, onEdit, onDelete }) => {
  return (
    <div className={`${styles.card} ${styles[deck.colorClass] || ""}`}>
      <div className={styles.header}>
        <h3>{deck.title}</h3>
        <span>{deck.level}</span>
      </div>

      <p className={styles.count}>{deck.totalCards || 0} thẻ</p>

      <div className={styles.progress}>
        <div className={styles.bar}>
          <div style={{ width: `${deck.progressPercent || 0}%` }}></div>
        </div>
        <small>Tiến độ: {deck.progressPercent || 0}%</small>
      </div>

      <p className={styles.last}>Lần cập nhật: {deck.lastReviewText}</p>

      <div className={styles.actions}>
        <button className={styles.studyBtn} onClick={onStudy}>
          <i className="fa-solid fa-play" />
          <span className={styles.text}>Học ngay</span>
        </button>

        <button className={styles.editBtn} onClick={() => onEdit(deck)}>
          <i className="fa-solid fa-pen" />
          <span className={styles.text}>Thêm thẻ</span>
        </button>

        <button className={styles.deleteBtn} onClick={() => onDelete(deck)}>
          <i className="fa-solid fa-trash" />
          <span className={styles.text}>Xóa</span>
        </button>
      </div>
    </div>
  );
};

export default DeckCard;
