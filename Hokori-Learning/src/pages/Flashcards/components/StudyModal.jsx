import React, { useEffect, useState } from "react";
import styles from "./StudyModal.module.scss";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { fetchCardsBySet } from "../../../redux/features/flashcardLearnerSlice";

const StudyModal = ({ deck, onClose }) => {
  const dispatch = useDispatch();
  const { cardsBySet, loadingCards } = useSelector(
    (state) => state.flashcards
  );

  const [current, setCurrent] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  const rawCards = cardsBySet[deck.id] || [];
  const loading = loadingCards[deck.id];

  const cards = rawCards.map((c) => ({
    id: c.id,
    front: c.frontText,
    back:
      c.backText +
      (c.reading ? ` (${c.reading})` : "") +
      (c.exampleSentence ? `\nVí dụ: ${c.exampleSentence}` : ""),
  }));

  // Fetch cards nếu chưa có
  useEffect(() => {
    if (!deck?.id) return;
    if (!cardsBySet[deck.id] || cardsBySet[deck.id].length === 0) {
      dispatch(fetchCardsBySet(deck.id))
        .unwrap()
        .catch(() => {
          toast.error("Không tải được thẻ trong bộ này.");
        });
    }
  }, [deck, dispatch, cardsBySet]);

  useEffect(() => {
    // reset state khi deck/cards change
    setCurrent(0);
    setIsFlipped(false);
    setFinished(cards.length === 0);
  }, [deck.id, cards.length]);

  const handleFlip = () => {
    if (!cards.length) return;
    setIsFlipped((f) => !f);
  };

  const handleResult = () => {
    // chưa có SRS backend → chỉ next card
    if (current < cards.length - 1) {
      setCurrent((i) => i + 1);
      setIsFlipped(false);
    } else {
      setFinished(true);
    }
  };

  const card = cards[current];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
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
            <h3>Chưa có thẻ nào trong bộ này</h3>
            <p>Hãy thêm một vài thẻ trước khi bắt đầu ôn tập.</p>
            <button className={styles.closeBtn} onClick={onClose}>
              Đóng
            </button>
          </div>
        ) : !finished ? (
          <>
            <div
              className={`${styles.flashcard} ${
                isFlipped ? styles.flipped : ""
              }`}
              onClick={handleFlip}
            >
              <div className={styles.front}>{card.front}</div>
              <div className={styles.back}>
                {card.back.split("\n").map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>

            <div className={styles.progressText}>
              {current + 1} / {cards.length} thẻ
            </div>

            <div className={styles.actions}>
              <button className={styles.again} onClick={handleResult}>
                Chưa nhớ
              </button>
              <button className={styles.medium} onClick={handleResult}>
                Tạm ổn
              </button>
              <button className={styles.easy} onClick={handleResult}>
                Nhớ tốt
              </button>
            </div>
          </>
        ) : (
          <div className={styles.doneBox}>
            <h3>Hoàn thành buổi ôn tập!</h3>
            <p>Bạn đã học xong {cards.length} thẻ trong bộ này.</p>
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
