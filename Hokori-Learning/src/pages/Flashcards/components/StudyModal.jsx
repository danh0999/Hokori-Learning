import React, { useEffect, useState } from "react";
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
  const { cardsBySet, loadingCards } = useSelector((state) => state.flashcards);

  const [current, setCurrent] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  const rawCards = cardsBySet[deck.id] || [];
  const loading = loadingCards[deck.id];

  // =====================
  // Chuẩn hóa card
  // =====================
  const cards = rawCards.map((c) => ({
    id: c.id,
    front: c.frontText,
    meaning: c.backText,
    reading: c.reading,
    example: c.exampleSentence,
  }));

  // Fetch thẻ khi chưa có
  useEffect(() => {
    if (!deck?.id) return;
    if (!cardsBySet[deck.id] || cardsBySet[deck.id].length === 0) {
      dispatch(fetchCardsBySet(deck.id)).catch(() => {
        toast.error("Không tải được thẻ.");
      });
    }
  }, [deck.id, dispatch]);

  // Reset khi đổi thẻ
  useEffect(() => {
    setCurrent(0);
    setIsFlipped(false);
    setFinished(cards.length === 0);
    setMasteredCount(0);
  }, [deck.id, rawCards.length]);

  const handleFlip = () => {
    if (!cards.length) return;
    setIsFlipped((f) => !f);
  };

  const handleResult = (rating) => {
    if (!cards.length) return;

    const card = cards[current];
    const status = rating === "easy" ? "MASTERED" : "LEARNING";

    dispatch(updateFlashcardProgress({ cardId: card.id, status })).catch(
      () => {}
    );

    if (rating === "easy") setMasteredCount((c) => c + 1);

    if (current < cards.length - 1) {
      setCurrent((i) => i + 1);
      setIsFlipped(false);
    } else {
      setFinished(true);

      const percent = cards.length
        ? Math.round(((masteredCount + 1) / cards.length) * 100)
        : 0;

      dispatch(setDeckProgress({ setId: deck.id, percent }));
      toast.success(`Hoàn thành! Tiến độ hiện tại ~${percent}%`);
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

        {loading ? (
          <p className={styles.loading}>Đang tải thẻ...</p>
        ) : !cards.length ? (
          <div className={styles.doneBox}>
            <h3>Chưa có thẻ nào</h3>
            <p>Hãy thêm thẻ vào bộ trước khi học.</p>
            <button className={styles.closeBtn} onClick={onClose}>
              Đóng
            </button>
          </div>
        ) : !finished ? (
          <>
            {/* FLASHCARD */}
            <div
              className={`${styles.cardWrapper} ${
                isFlipped ? styles.flipped : ""
              }`}
              onClick={handleFlip}
            >
              <div className={styles.cardInner}>
                {/* MẶT TRƯỚC */}
                <div className={styles.cardFront}>
                  <div className={styles.frontContent}>{card.front}</div>
                </div>

                {/* MẶT SAU */}
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

            {/* Progress */}
            <div className={styles.progressText}>
              {current + 1} / {cards.length} thẻ
            </div>

            {/* ACTION BUTTONS */}
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
        ) : (
          <div className={styles.doneBox}>
            <h3>Hoàn thành buổi học!</h3>
            <p>Bạn đã học xong {cards.length} thẻ.</p>
            <button className={styles.closeBtn} onClick={onClose}>
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyModal;
