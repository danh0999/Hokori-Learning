// src/pages/FlashcardPage/FlashcardPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../configs/axios";
import styles from "./FlashcardPage.module.scss";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

export default function FlashcardPage() {
  const { sectionContentId } = useParams();

  const [setInfo, setSetInfo] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Đếm số thẻ đã "next" → dùng để vẽ progress bar
  const [learnedCount, setLearnedCount] = useState(0);

  /* ============================================================
     FETCH FLASHCARD SET + CARDS
  ============================================================ */
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 1) Lấy metadata của set
        const setRes = await api.get(
          `/learner/contents/${sectionContentId}/flashcard-set`
        );
        const setData = setRes.data;
        setSetInfo(setData);

        // 2) Lấy danh sách thẻ trong set
        const cardsRes = await api.get(
          `/flashcards/sets/${setData.id}/cards`
        );
        setCards(cardsRes.data || []);
        setCurrent(0);
        setFlipped(false);
        setLearnedCount(0);
      } catch (err) {
        console.error("Lỗi tải flashcard set:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sectionContentId]);

  /* ============================================================
     PROGRESS BAR (OPTION A)
     Tiến trình = số thẻ đã Next / tổng số thẻ
  ============================================================ */
  const progressPercent =
    cards.length > 0
      ? Math.min(100, Math.round((learnedCount / cards.length) * 100))
      : 0;

  /* ============================================================
     GỌI API CẬP NHẬT PROGRESS
  ============================================================ */
  const updateProgress = async (flashcardId, status) => {
    try {
      await api.post(`/flashcards/progress/${flashcardId}`, { status });
      // Không cần set state gì thêm, backend tự tăng reviewCount, v.v.
    } catch (err) {
      console.error("Lỗi cập nhật progress:", err);
    }
  };

  /* ============================================================
     HANDLERS
  ============================================================ */
  const handleFlip = () => {
    if (!cards.length) return;
    setFlipped((v) => !v);
  };

  const handleNext = () => {
    if (!cards.length) return;

    const card = cards[current];
    if (!card) return;

    const isLast = current === cards.length - 1;
    const status = isLast ? "MASTERED" : "LEARNING";

    // Gọi API cập nhật tiến độ
    updateProgress(card.id, status);

    // Tăng tiến độ local để vẽ progress bar
    setLearnedCount((prev) => Math.min(prev + 1, cards.length));

    // Chuyển thẻ tiếp theo (nếu có)
    if (!isLast) {
      setCurrent((i) => i + 1);
      setFlipped(false);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent((i) => i - 1);
      setFlipped(false);
    }
  };

  const card = cards[current];

  /* ============================================================
     RENDER
  ============================================================ */

  if (loading) {
    return <div className={styles.loading}>Đang tải flashcard...</div>;
  }

  if (!cards.length) {
    return (
      <div className={styles.empty}>
        <h2>{setInfo?.title || "Flashcard"}</h2>
        <p>Bộ này hiện chưa có thẻ nào.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* TIÊU ĐỀ */}
      <h2 className={styles.title}>{setInfo?.title || "Flashcard"}</h2>
      <div className={styles.counter}>
        {current + 1} / {cards.length}
      </div>

      {/* PROGRESS BAR */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* FLASHCARD */}
      <div className={styles.cardWrapper} onClick={handleFlip}>
        <div
          className={`${styles.cardInner} ${
            flipped ? styles.flipped : ""
          }`}
        >
          {/* MẶT TRƯỚC */}
          <div className={styles.cardFace + " " + styles.cardFront}>
            <div className={styles.frontContent}>{card.frontText}</div>
          </div>

          {/* MẶT SAU */}
          <div className={styles.cardFace + " " + styles.cardBack}>
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

      {/* NÚT ĐIỀU HƯỚNG */}
      <div className={styles.nav}>
        <button
          className={styles.navBtn}
          disabled={current === 0}
          onClick={handlePrev}
        >
          <IoChevronBack />
        </button>

        <button
          className={styles.navBtn}
          disabled={current === cards.length - 1}
          onClick={handleNext}
        >
          <IoChevronForward />
        </button>
      </div>
    </div>
  );
}
