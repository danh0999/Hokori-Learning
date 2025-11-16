import React from "react";
import styles from "./DeckCard.module.scss";

const DeckCard = ({ deck, onStudy, onEdit, onDelete }) => {
  return (
    <div className={`${styles.card} ${styles[deck.mau]}`}>
      <div className={styles.header}>
        <h3>{deck.tenBo}</h3>
        <span>{deck.capDo}</span>
      </div>

      <p className={styles.count}>{deck.tongThe} thẻ</p>

      <div className={styles.progress}>
        <div className={styles.bar}>
          <div style={{ width: `${deck.tienDo}%` }}></div>
        </div>
        <small>Tiến độ: {deck.tienDo}%</small>
      </div>

      <p className={styles.last}>Lần ôn gần nhất: {deck.lanCuoi}</p>

      <div className={styles.actions}>
        <button className={styles.studyBtn} onClick={onStudy}>
          <i className="fa-solid fa-play" />
          <span className={styles.text}>Học ngay</span>
        </button>

        <button className={styles.editBtn} onClick={() => onEdit(deck)}>
          <i className="fa-solid fa-pen" />
          <span className={styles.text}>Chỉnh sửa</span>
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
