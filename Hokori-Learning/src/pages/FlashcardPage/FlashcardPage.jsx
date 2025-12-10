// src/pages/FlashcardPage/FlashcardPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../configs/axios";
import styles from "./FlashcardPage.module.scss";
import { IoChevronBack, IoChevronForward, IoArrowBack } from "react-icons/io5"; // Import IoArrowBack
import { updateContentProgress } from "../../services/learningProgressService";

export default function FlashcardPage() {
  const { sectionContentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Lấy state từ router

  const [setInfo, setSetInfo] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);

  // --- LOGIC NÚT BACK ---
  const handleBack = () => {
    // Nếu có state courseId và lessonId -> Về đúng bài học đó
    if (location.state?.courseId && location.state?.lessonId) {
        navigate(`/course/${location.state.courseId}/lesson/${location.state.lessonId}`);
    } else {
        // Fallback: quay lại trang trước trong lịch sử duyệt web
        navigate(-1);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const setRes = await api.get(`/learner/contents/${sectionContentId}/flashcard-set`);
        const setData = setRes.data;
        setSetInfo(setData);

        const cardsRes = await api.get(`/flashcards/sets/${setData.id}/cards`);
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

  const progressPercent = cards.length > 0
      ? Math.min(100, Math.round((learnedCount / cards.length) * 100))
      : 0;

  const updateProgress = async (flashcardId, status) => {
    try {
      await api.post(`/flashcards/progress/${flashcardId}`, { status });
    } catch (err) {
      console.error("Lỗi cập nhật progress:", err);
    }
  };

  const markCourseContentCompleted = async () => {
    try {
      await updateContentProgress(sectionContentId, { isCompleted: true });
    } catch (err) {
      console.error("Lỗi cập nhật progress course:", err);
    }
  };

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

    updateProgress(card.id, status);
    setLearnedCount((prev) => Math.min(prev + 1, cards.length));
    
    if (isLast) {
      markCourseContentCompleted();
    }
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

  if (loading) {
    return <div className={styles.loading}>Đang tải flashcard...</div>;
  }

  return (
    <div className={styles.wrapper}>
      {/* ✅ NÚT QUAY LẠI BÀI HỌC */}
      <button className={styles.backButton} onClick={handleBack}>
        <IoArrowBack /> Quay lại bài học
      </button>

      {!cards.length ? (
        <div className={styles.empty}>
          <h2>{setInfo?.title || "Flashcard"}</h2>
          <p>Bộ này hiện chưa có thẻ nào.</p>
        </div>
      ) : (
        <>
          <h2 className={styles.title}>{setInfo?.title || "Flashcard"}</h2>
          <div className={styles.counter}>
            {current + 1} / {cards.length}
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className={styles.cardWrapper} onClick={handleFlip}>
            <div className={`${styles.cardInner} ${flipped ? styles.flipped : ""}`}>
              <div className={styles.cardFace + " " + styles.cardFront}>
                <div className={styles.frontContent}>{card.frontText}</div>
              </div>
              <div className={styles.cardFace + " " + styles.cardBack}>
                <div className={styles.backContent}>
                  <div className={styles.meaning}>{card.backText}</div>
                  {card.reading && <div className={styles.reading}>({card.reading})</div>}
                  {card.exampleSentence && (
                    <div className={styles.exampleBox}>
                      <p className={styles.exampleLabel}>Ví dụ:</p>
                      <p className={styles.exampleText}>{card.exampleSentence}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.nav}>
            <button className={styles.navBtn} disabled={current === 0} onClick={handlePrev}>
              <IoChevronBack />
            </button>
            <button className={styles.navBtn} disabled={current === cards.length - 1} onClick={handleNext}>
              <IoChevronForward />
            </button>
          </div>
        </>
      )}
    </div>
  );
}