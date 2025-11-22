// src/pages/Flashcards/components/DeckCard.jsx
import React from "react";
import styles from "./DeckCard.module.scss";

const DeckCard = ({ deck, onStudy, onEdit, onAddCard, onDelete }) => {
  return (
    <div className={`${styles.card} ${styles[deck.colorClass] || ""}`}>
      <div className={styles.header}>
        <h3>{deck.title}</h3>

        <span>{deck.level}</span>
      </div>
      <p>{deck.description}</p>
      <p className={styles.count}>{deck.totalCards || 0} thẻ</p>

      <div className={styles.progress}>
        <div className={styles.bar}>
          <div style={{ width: `${deck.progressPercent || 0}%` }}></div>
        </div>
        <small>Tiến độ: {deck.progressPercent || 0}%</small>
      </div>

      <p className={styles.last}>Lần cập nhật: {deck.lastReviewText}</p>

      <div className={styles.actions}>
        {/* HOC NGAY */}
        <button className={styles.studyBtn} onClick={onStudy}>
          <i className="fa-solid fa-play" />
          <span>Học ngay</span>
        </button>

        {/* SỬA BỘ THẺ */}
        <button
          className={styles.editBtn}
          onClick={() => {
            onEdit(); //
          }}
        >
          <i className="fa-solid fa-pen" />
          <span>Chỉnh sửa</span>
        </button>

        {/* THÊM THẺ */}
        <button className={styles.addBtn} onClick={onAddCard}>
          <i className="fa-solid fa-plus" />
          <span>Thêm thẻ</span>
        </button>

        {/* XÓA */}
        <button className={styles.deleteBtn} onClick={() => onDelete(deck)}>
          <i className="fa-solid fa-trash" />
          <span>Xóa</span>
        </button>
      </div>
    </div>
  );
};

export default DeckCard;
