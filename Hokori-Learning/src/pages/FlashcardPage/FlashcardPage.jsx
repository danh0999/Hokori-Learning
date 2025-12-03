import React, { useEffect, useState } from "react";
import styles from "./FlashcardPage.module.scss";
import api from "../../configs/axios";
import { useParams } from "react-router-dom";

export default function FlashcardPage() {
  const { sectionContentId } = useParams();

  const [setInfo, setSetInfo] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const [progress, setProgress] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);

  /* ============================================================
      TÍNH PROGRESS %
  ============================================================ */
  function getProgressPercent(status) {
    if (status === "MASTERED") return 100;
    if (status === "LEARNING") return 50;
    return 0;
  }

  /* ============================================================
      FETCH FLASHCARD SET + CARDS
  ============================================================ */
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 1. GET metadata của set
        const setRes = await api.get(
          `/learner/contents/${sectionContentId}/flashcard-set`
        );
        const setData = setRes.data;
        setSetInfo(setData);

        // 2. GET danh sách flashcards
        const cardsRes = await api.get(`/flashcards/sets/${setData.id}/cards`);
        setCards(cardsRes.data || []);
      } catch (err) {
        console.error("Flashcard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sectionContentId]);

  /* ============================================================
      FETCH PROGRESS CỦA 1 FLASHCARD
  ============================================================ */
  async function fetchProgress(cardId) {
    try {
      const res = await api.get(`/flashcards/progress/${cardId}`);
      const p = res.data;
      setProgress(p);
      setProgressPercent(getProgressPercent(p.status));
    } catch (err) {
      console.error("Error loading progress:", err);
    }
  }

  // Mỗi khi đổi thẻ → fetch progress mới
  useEffect(() => {
    if (cards.length > 0 && cards[current]?.id) {
      fetchProgress(cards[current].id);
    }
  }, [current, cards]);

  /* ============================================================
      HANDLERS
  ============================================================ */
  const flipCard = () => setFlipped((v) => !v);

  const nextCard = () => {
    if (current < cards.length - 1) {
      setCurrent((i) => i + 1);
      setFlipped(false);
    }
  };

  const prevCard = () => {
    if (current > 0) {
      setCurrent((i) => i - 1);
      setFlipped(false);
    }
  };

  /* ============================================================
      RENDER
  ============================================================ */

  const card = cards[current];

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.pageHeader}>
        <h2>{setInfo?.title || "Flashcard"}</h2>
        <p className={styles.sub}>
          {cards.length > 0 ? `${current + 1} / ${cards.length}` : ""}
        </p>
      </div>

      {/* LOADING */}
      {loading && <p className={styles.loading}>Đang tải...</p>}

      {/* EMPTY */}
      {!loading && cards.length === 0 && (
        <p className={styles.empty}>Chưa có thẻ nào trong bộ này.</p>
      )}

      {/* FLASHCARD */}
      {!loading && card && (
        <>
          {/* PROGRESS BAR */}
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <div
            className={`${styles.cardWrapper} ${
              flipped ? styles.flipped : ""
            }`}
            onClick={flipCard}
          >
            <div className={styles.cardInner}>
              {/* FRONT */}
              <div className={styles.cardFront}>
                <div className={styles.frontContent}>{card.frontText}</div>
              </div>

              {/* BACK */}
              <div className={styles.cardBack}>
                <div className={styles.backContent}>
                  <div className={styles.meaning}>{card.backText}</div>
                  {card.reading && (
                    <div className={styles.reading}>({card.reading})</div>
                  )}

                  {card.exampleSentence &&
                    card.exampleSentence.trim() !== "" && (
                      <div className={styles.exampleBox}>
                        <p className={styles.exampleLabel}>Ví dụ:</p>
                        <p className={styles.exampleText}>
                          {card.exampleSentence}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <div className={styles.nav}>
            <button
              className={styles.navBtn}
              disabled={current === 0}
              onClick={prevCard}
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>

            <button
              className={styles.navBtn}
              disabled={current === cards.length - 1}
              onClick={nextCard}
            >
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
