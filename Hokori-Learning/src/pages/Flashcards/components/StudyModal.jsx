import React, { useEffect, useState, useMemo } from "react";
import styles from "./StudyModal.module.scss";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchCardsBySet,
  updateFlashcardProgress,
  setDeckProgress,
} from "../../../redux/features/flashcardLearnerSlice";

const StudyModal = ({ deck, onClose }) => {
  const dispatch = useDispatch();
  const { cardsBySet, loadingCards } = useSelector((s) => s.flashcards);

  const [current, setCurrent] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [mastered, setMastered] = useState(0);

  const rawCards = cardsBySet[deck.id] || [];
  const loading = loadingCards[deck.id];

  // Chuẩn hóa dữ liệu thẻ
  const cards = useMemo(() => {
    return rawCards.map((c) => ({
      id: c.id,
      front: c.frontText,
      meaning: c.backText,
      reading: c.reading,
      example: c.exampleSentence,
    }));
  }, [rawCards]);

  /* ===========================================================
     FETCH CARDS
  ============================================================ */
  useEffect(() => {
    if (!deck.id) return;
    if (!rawCards.length) dispatch(fetchCardsBySet(deck.id));
  }, [deck.id]);

  /* ===========================================================
     RESET STATE KHI MỞ MODAL
  ============================================================ */
  useEffect(() => {
    setCurrent(0);
    setIsFlipped(false);
    setFinished(cards.length === 0);
    setMastered(0);
  }, [deck.id, cards.length]);

  /* ===========================================================
     HANDLERS
  ============================================================ */
  const handleFlip = () => {
    if (!cards.length) return;
    setIsFlipped((v) => !v);
  };

  const next = () => {
    if (current < cards.length - 1) {
      setCurrent((i) => i + 1);
      setIsFlipped(false);
    }
  };

  const prev = () => {
    if (current > 0) {
      setCurrent((i) => i - 1);
      setIsFlipped(false);
    }
  };

  const handleResult = async (rating) => {
    const card = cards[current];
    if (!card) return;

    const status = rating === "easy" ? "MASTERED" : "LEARNING";

    dispatch(updateFlashcardProgress({ cardId: card.id, status }));

    if (rating === "easy") setMastered((m) => m + 1);

    // Chuyển thẻ tiếp theo
    if (current < cards.length - 1) {
      next();
    } else {
      // HOÀN THÀNH
      const percent = cards.length
        ? Math.round(((mastered + 1) / cards.length) * 100)
        : 0;

      dispatch(setDeckProgress({ setId: deck.id, percent }));
      setFinished(true);

      toast.success(`Hoàn thành! Tiến độ hiện tại: ${percent}%`);
    }
  };

  const card = cards[current];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* HEADER */}
        <div className={styles.header}>
          <h2>{deck.title}</h2>
          <button onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* LOADING */}
        {loading ? (
          <p className={styles.loading}>Đang tải thẻ...</p>
        ) : !cards.length ? (
          <div className={styles.doneBox}>
            <h3>Chưa có thẻ</h3>
            <button className={styles.closeBtn} onClick={onClose}>
              Đóng
            </button>
          </div>
        ) : finished ? (
          /* ====================================================
             FINISHED STATE
          ==================================================== */
          <div className={styles.doneBox}>
            <h3>Hoàn thành buổi học!</h3>
            <p>Bạn đã học xong {cards.length} thẻ.</p>

            <div className={styles.doneActions}>
              <button
                className={styles.restartBtn}
                onClick={() => {
                  setCurrent(0);
                  setIsFlipped(false);
                  setFinished(false);
                  setMastered(0);
                }}
              >
                Học lại
              </button>

              <button className={styles.closeBtn} onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ====================================================
               FLASHCARD
            ==================================================== */}
            <div
              className={`${styles.cardWrapper} ${
                isFlipped ? styles.flipped : ""
              }`}
              onClick={handleFlip}
            >
              <div className={styles.cardInner}>
                {/* FRONT */}
                <div className={styles.cardFront}>
                  <div className={styles.frontContent}>{card.front}</div>
                </div>

                {/* BACK */}
                <div className={styles.cardBack}>
                  <div className={styles.backContent}>
                    <div className={styles.meaning}>{card.meaning}</div>

                    {card.reading && (
                      <div className={styles.reading}>({card.reading})</div>
                    )}

                    {card.example && (
                      <div className={styles.exampleBox}>
                        <p className={styles.exampleLabel}>Ví dụ:</p>
                        <p className={styles.exampleText}>{card.example}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ====================================================
               NAVIGATION BAR
            ==================================================== */}
            <div className={styles.navBar}>
              <button
                className={styles.navBtn}
                disabled={current === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
              >
                <i className="fa-solid fa-arrow-left"></i>
              </button>

              <span className={styles.counter}>
                {current + 1} / {cards.length}
              </span>

              <button
                className={styles.navBtn}
                disabled={current === cards.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
              >
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>

            {/* ====================================================
               ACTION BUTTONS
            ==================================================== */}
            <div className={styles.actions}>
              <button
                className={styles.again}
                onClick={() => handleResult("again")}
              >
                Chưa nhớ
              </button>

              <button
                className={styles.medium}
                onClick={() => handleResult("medium")}
              >
                Tạm ổn
              </button>

              <button
                className={styles.easy}
                onClick={() => handleResult("easy")}
              >
                Nhớ tốt
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudyModal;
