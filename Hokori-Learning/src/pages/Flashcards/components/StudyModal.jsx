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

  const [learningQueue, setLearningQueue] = useState([]);
  const [current, setCurrent] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  // modal xác nhận thẻ cuối
  const [showLastCardModal, setShowLastCardModal] = useState(false);

  const rawCards = cardsBySet[deck.id] || [];
  const loading = loadingCards[deck.id];

  const cards = useMemo(() => {
    return rawCards.map((c) => ({
      id: c.id,
      front: c.frontText,
      meaning: c.backText,
      reading: c.reading,
      example: c.exampleSentence,
    }));
  }, [rawCards]);

  /* FETCH */
  useEffect(() => {
    if (!deck.id) return;
    if (!rawCards.length) dispatch(fetchCardsBySet(deck.id));
  }, [deck.id]);

  /* INIT – ❗ KHÔNG set finished ở đây */
  useEffect(() => {
    setLearningQueue(cards);
    setCurrent(0);
    setIsFlipped(false);
    setFinished(false);              // ✅ luôn false khi mở modal
    setShowLastCardModal(false);
  }, [deck.id, cards.length]);

  const card = learningQueue[current] || null;

  const handleFlip = () => {
    if (!card) return;
    setIsFlipped((v) => !v);
  };

  /* ======================
     CHƯA NHỚ
  ====================== */
  const handleUnlearned = () => {
    if (learningQueue.length === 1) {
      setShowLastCardModal(true);
      return;
    }

    const card = learningQueue[current];
    const newQueue = [...learningQueue];
    newQueue.splice(current, 1);
    newQueue.push(card);

    setLearningQueue(newQueue);
    setCurrent(0);
    setIsFlipped(false);
  };

  /* ======================
     NHỚ TỐT
  ====================== */
  const handleMastered = () => {
    if (learningQueue.length === 1) {
      setShowLastCardModal(true);
      return;
    }

    const card = learningQueue[current];

    dispatch(
      updateFlashcardProgress({
        cardId: card.id,
        status: "MASTERED",
      })
    );

    const newQueue = [...learningQueue];
    newQueue.splice(current, 1);

    setLearningQueue(newQueue);
    setCurrent(0);
    setIsFlipped(false);
  };

  /* ======================
     MODAL ACTIONS
  ====================== */
  const handleRestart = () => {
    setLearningQueue(cards);
    setCurrent(0);
    setIsFlipped(false);
    setShowLastCardModal(false);
  };

  const handleFinish = () => {
    dispatch(setDeckProgress({ setId: deck.id, percent: 100 }));
    setFinished(true);
    setShowLastCardModal(false);
    toast.success("Hoàn thành bộ thẻ 🎉");
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* HEADER */}
        <div className={styles.header}>
          <h2>{deck.title}</h2>
          <button onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {loading ? (
          <p className={styles.loading}>Đang tải thẻ...</p>

        ) : cards.length === 0 ? (
          /* ✅ CHƯA CÓ THẺ */
          <div className={styles.doneBox}>
            <h3>Bạn chưa có thẻ nào</h3>
            <p>Hãy tạo thẻ để bắt đầu học nhé.</p>
            <button className={styles.closeBtn} onClick={onClose}>
              Đóng
            </button>
          </div>

        ) : finished ? (
          /* ✅ HOÀN THÀNH THẬT */
          <div className={styles.doneBox}>
            <h3>Hoàn thành buổi học!</h3>
            <p>Bạn đã học xong bộ thẻ.</p>
            <button className={styles.closeBtn} onClick={onClose}>
              Đóng
            </button>
          </div>

        ) : !card ? (
          <p className={styles.loading}>Đang chuẩn bị thẻ...</p>

        ) : (
          <>
            {/* CARD */}
            <div
              className={`${styles.cardWrapper} ${
                isFlipped ? styles.flipped : ""
              }`}
              onClick={handleFlip}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardFront}>
                  <div className={styles.frontContent}>{card.front}</div>
                </div>

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

            {/* COUNTER */}
            <div className={styles.navBar}>
              <span className={styles.counter}>
                {current + 1} / {learningQueue.length}
              </span>
            </div>

            {/* ACTIONS */}
            <div className={styles.actions}>
              <button className={styles.again} onClick={handleUnlearned}>
                Chưa nhớ
              </button>
              <button className={styles.easy} onClick={handleMastered}>
                Nhớ tốt
              </button>
            </div>
          </>
        )}
      </div>

      {/* MODAL THẺ CUỐI */}
      {showLastCardModal && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <h3>Bạn đã học hết bộ thẻ</h3>
            <p>Bạn muốn học lại hay hoàn thành?</p>

            <div className={styles.confirmActions}>
              <button className={styles.reviewBtn} onClick={handleRestart}>
                Học lại
              </button>
              <button className={styles.finishBtn} onClick={handleFinish}>
                Hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyModal;
