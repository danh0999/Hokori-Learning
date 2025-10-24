// src/pages/Flashcards/StudyModal.jsx
import React, { useState } from "react";
import styles from "./StudyModal.module.scss";

const StudyModal = ({ deck, onClose }) => {
  // ⚠️ MOCK DATA — sẽ thay bằng API thật
  const cards = [
    { id: 1, front: "食べる", back: "Ăn / to eat (taberu)" },
    { id: 2, front: "飲む", back: "Uống / to drink (nomu)" },
    { id: 3, front: "行く", back: "Đi / to go (iku)" },
  ];

  const [current, setCurrent] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  const card = cards[current];

  const handleFlip = () => setIsFlipped((f) => !f);

  const handleResult = async (result) => {
    // ✅ FE chỉ gửi event học — BE xử lý SRS & DB
    try {
      await fetch(`/api/flashcards/${deck.id}/study`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, result }),
      });
    } catch (e) {
      console.error("Mock study submit failed:", e);
    }

    if (current < cards.length - 1) {
      setCurrent((i) => i + 1);
      setIsFlipped(false);
    } else {
      setFinished(true);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{deck.tenBo}</h2>
          <button onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {!finished ? (
          <>
            <div
              className={`${styles.flashcard} ${isFlipped ? styles.flipped : ""}`}
              onClick={handleFlip}
            >
              <div className={styles.front}>{card.front}</div>
              <div className={styles.back}>{card.back}</div>
            </div>

            <div className={styles.progressText}>
              {current + 1} / {cards.length} thẻ
            </div>

            <div className={styles.actions}>
              <button className={styles.again} onClick={() => handleResult("AGAIN")}>Chưa nhớ</button>
              <button className={styles.medium} onClick={() => handleResult("MEDIUM")}>Tạm ổn</button>
              <button className={styles.easy} onClick={() => handleResult("EASY")}>Nhớ tốt</button>
            </div>
          </>
        ) : (
          <div className={styles.doneBox}>
            <h3> Hoàn thành buổi ôn tập!</h3>
            <p>Bạn đã học xong {cards.length} thẻ trong bộ này.</p>
            <button className={styles.closeBtn} onClick={onClose}>Đóng</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyModal;
