import React from "react";
import { FaPlus } from "react-icons/fa";
import styles from "./Flashcards.module.scss";

const Flashcards = ({ sets = [], onStartReview, onCreate }) => {
  return (
    <section className="card">
      <div className={styles.header}>
        <h3>Flashcards</h3>
        <button className={styles.iconBtn} aria-label="add" onClick={onCreate}>
          <FaPlus />
        </button>
      </div>

      <div className={styles.list}>
        {sets.map((s) => (
          <div className={styles.item} key={s.id}>
            <div className={styles.row}>
              <span className={styles.name}>{s.title}</span>
              <span className={styles.muted}>{s.total} thẻ</span>
            </div>
            <div className={styles.sub}>Ôn tập hôm nay: {s.reviewToday} thẻ</div>
          </div>
        ))}
        {sets.length === 0 && <div className={styles.empty}>Chưa có bộ thẻ nào.</div>}
      </div>

      <button className={styles.btn} onClick={onStartReview}>Bắt đầu ôn tập</button>
    </section>
  );
};

export default Flashcards;
