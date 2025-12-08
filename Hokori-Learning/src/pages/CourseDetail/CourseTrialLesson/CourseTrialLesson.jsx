// src/pages/CourseTrialLesson/CourseTrialLesson.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../../configs/axios.js";
import { buildFileUrl } from "../../../utils/fileUrl.js";
import "./CourseTrialLesson.scss";

/* ========================
   Helper: unwrap response
======================== */
const unwrap = (res) =>
  res?.data && typeof res.data === "object" && "data" in res.data
    ? res.data.data
    : res.data;

/* ========================
   Flashcard Modal (trial)
======================== */
const TrialFlashcardModal = ({
  open,
  onClose,
  sectionTitle,
  sectionContentId,
}) => {
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!open || !sectionContentId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setFlipped(false);
      setCurrentIndex(0);

      try {
        const [setRes, cardsRes] = await Promise.all([
          api.get(`/courses/contents/${sectionContentId}/trial-flashcard`),
          api.get(
            `/courses/contents/${sectionContentId}/trial-flashcard/cards`
          ),
        ]);

        const setData = unwrap(setRes);
        const cardsData = unwrap(cardsRes) || [];

        setFlashcardSet(setData);
        setCards(cardsData);
      } catch (err) {
        console.error("Error loading trial flashcards", err);
        setError(
          err?.response?.data?.message ||
            "Không tải được flashcard. Vui lòng thử lại sau."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, sectionContentId]);

  const handleClose = () => {
    setFlashcardSet(null);
    setCards([]);
    setCurrentIndex(0);
    setFlipped(false);
    setError(null);
    onClose();
  };

  const handleNext = () => {
    if (!cards.length) return;
    setCurrentIndex((prev) => (prev + 1) % cards.length);
    setFlipped(false);
  };

  const handlePrev = () => {
    if (!cards.length) return;
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    setFlipped(false);
  };

  if (!open) return null;

  const currentCard = cards[currentIndex];

  const frontText =
    currentCard?.frontText ||
    currentCard?.front ||
    currentCard?.term ||
    currentCard?.question ||
    "";
  const backText =
    currentCard?.backText ||
    currentCard?.back ||
    currentCard?.definition ||
    currentCard?.answer ||
    "";

  return (
    <div className="trial-flashcard-backdrop" onClick={handleClose}>
      <div
        className="trial-flashcard-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="modal-label">Học thử bằng flashcard</p>
            <h2>{sectionTitle || "Flashcard"}</h2>
          </div>
          <button className="icon-btn" type="button" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading && <p className="flashcard-loading">Đang tải flashcard…</p>}

          {error && <p className="flashcard-error">{error}</p>}

          {!loading && !error && !cards.length && (
            <p className="flashcard-empty">Chưa có thẻ nào trong bộ này.</p>
          )}

          {!loading && !error && cards.length > 0 && (
            <>
              {flashcardSet?.title && (
                <p className="flashcard-set-title">{flashcardSet.title}</p>
              )}

              <div
                className={`flashcard-card ${flipped ? "is-flipped" : ""}`}
                onClick={() => setFlipped((f) => !f)}
              >
                <div className="flashcard-inner">
                  <div className="flashcard-face flashcard-front">
                    <p>{frontText || "Mặt trước"}</p>
                    <span className="hint">Nhấn để lật thẻ →</span>
                  </div>
                  <div className="flashcard-face flashcard-back">
                    <p>{backText || "Mặt sau"}</p>
                  </div>
                </div>
              </div>

              <div className="flashcard-controls">
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={handlePrev}
                >
                  ← Trước
                </button>
                <span className="index">
                  {currentIndex + 1}/{cards.length}
                </span>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={handleNext}
                >
                  Sau →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ========================
   Main Trial Lesson Page
======================== */
const CourseTrialLesson = () => {
  const { id: courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [trialCourse, setTrialCourse] = useState(null); // data từ /trial-tree
  const [trialLessons, setTrialLessons] = useState([]); // danh sách lesson trong trial chapter

  const [activeLessonId, setActiveLessonId] = useState(null);
  const [activeSectionId, setActiveSectionId] = useState(null);

  const [flashcardModalOpen, setFlashcardModalOpen] = useState(false);
  const [selectedFlashcardContent, setSelectedFlashcardContent] =
    useState(null);

  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState(null);

  /* ========================
     1. LOGIN GATE + GET TRIAL TREE
     /api/courses/{courseId}/trial-tree
  ========================= */
  useEffect(() => {
    const fetchTrialTree = async () => {
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!token) {
        navigate("/login", {
          state: { redirectTo: location.pathname },
          replace: true,
        });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await api.get(`/courses/${courseId}/trial-tree`);
        const data = unwrap(res); // course với 1 trial chapter, nhiều lessons :contentReference[oaicite:1]{index=1}
        setTrialCourse(data);

        const trialChapter =
          data?.chapters?.find((ch) => ch.isTrial) || data?.chapters?.[0];

        if (!trialChapter) {
          throw new Error("Khóa học chưa có chapter học thử.");
        }

        const lessons = trialChapter.lessons || [];
        if (!lessons.length) {
          throw new Error("Chapter học thử chưa có bài học.");
        }

        setTrialLessons(lessons);

        // chọn lesson ban đầu: ưu tiên lessonId trên URL, nếu không thì lesson đầu
        let initialLesson =
          (lessonId &&
            lessons.find((l) => String(l.id) === String(lessonId))) ||
          lessons[0];

        setActiveLessonId(initialLesson.id);

        // chọn section đầu tiên của lesson
        const firstSection = initialLesson.sections?.[0];
        setActiveSectionId(firstSection?.id || firstSection?.sectionId || null);
      } catch (err) {
        console.error("Error fetching trial tree", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialTree();
  }, [courseId, lessonId, navigate, location.pathname]);

  /* ========================
     2. Tính lesson / section active
  ========================= */
  const activeLesson = useMemo(() => {
    if (!trialLessons.length) return null;
    if (!activeLessonId) return trialLessons[0];
    return trialLessons.find((l) => l.id === activeLessonId) || trialLessons[0];
  }, [trialLessons, activeLessonId]);

  const activeSection = useMemo(() => {
    if (!activeLesson?.sections?.length) return null;
    if (!activeSectionId) return activeLesson.sections[0];
    return (
      activeLesson.sections.find(
        (s) => s.id === activeSectionId || s.sectionId === activeSectionId
      ) || activeLesson.sections[0]
    );
  }, [activeLesson, activeSectionId]);

  const handleOpenFlashcard = (section, content) => {
    setSelectedFlashcardContent({
      sectionTitle: section.title,
      sectionContentId: content.id || content.contentId,
    });
    setFlashcardModalOpen(true);
  };

  /* ========================
     Helper: render toàn bộ content của 1 section
     - Nếu section có asset + rich_text → hiện cùng luôn (video trên, lý thuyết dưới)
  ========================= */
  const renderSectionContents = (section) => {
    if (!section || !section.contents || !section.contents.length) {
      return (
        <div className="viewer-empty">
          Phần này chưa có nội dung để học thử.
        </div>
      );
    }

    return section.contents.map((content, index) => {
      const key = `${section.id || section.sectionId}-${content.id || index}`;

      // ASSET: video / image
      if (content.contentFormat === "ASSET" && content.filePath) {
        const fileUrl = buildFileUrl(content.filePath);
        const isVideo = /\.(mp4|webm|ogg)$/i.test(fileUrl || "");

        return (
          <div key={key} className="viewer-block viewer-asset">
            {isVideo ? (
              <video
                controls
                src={fileUrl}
                className="viewer-video"
                preload="metadata"
              />
            ) : (
              <img
                src={fileUrl}
                alt={content.title || "Trial asset"}
                className="viewer-image"
              />
            )}

            {content.richText && (
              <div
                className="viewer-caption"
                dangerouslySetInnerHTML={{ __html: content.richText }}
              />
            )}
          </div>
        );
      }

      // RICH_TEXT
      if (content.contentFormat === "RICH_TEXT" && content.richText) {
        return (
          <div
            key={key}
            className="viewer-block viewer-richtext"
            dangerouslySetInnerHTML={{ __html: content.richText }}
          />
        );
      }

      // FLASHCARD_SET – vẫn dùng modal
      if (content.contentFormat === "FLASHCARD_SET") {
        return (
          <div key={key} className="viewer-block viewer-flashcard">
            <p className="viewer-flashcard-text">
              Đây là bộ flashcard cho phần từ vựng bài học này.
            </p>
            <button
              type="button"
              className="primary-outline-btn"
              onClick={() => handleOpenFlashcard(section, content)}
            >
              Mở flashcard
            </button>
          </div>
        );
      }

      // fallback
      return (
        <div key={key} className="viewer-empty">
          Nội dung thử (type: {content.contentFormat}) chưa được hỗ trợ hiển
          thị.
        </div>
      );
    });
  };

  /* ========================
     3. START QUIZ TRIAL THEO LESSON ĐANG CHỌN
  ========================= */
  const handleStartTrialQuiz = async () => {
    if (!activeLesson) return;
    const lId = activeLesson.id;

    setQuizLoading(true);
    setQuizError(null);

    try {
      await api.get(`/learner/lessons/${lId}/quiz/info`);

      const startRes = await api.post(
        `/learner/lessons/${lId}/quiz/attempts/start`,
        { forceNew: false }
      );

      const attempt = unwrap(startRes);
      const attemptId = attempt?.id || attempt?.attemptId;

      if (attemptId) {
        navigate(`/learner/quiz/attempts/${attemptId}`);
      } else {
        setQuizError("Không xác định được attempt của quiz.");
      }
    } catch (err) {
      console.error("Error starting trial quiz", err);
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        "Không bắt đầu được quiz. Vui lòng thử lại.";
      setQuizError(msg);

      if (status === 401) {
        navigate("/login", {
          state: { redirectTo: location.pathname },
          replace: true,
        });
      }
    } finally {
      setQuizLoading(false);
    }
  };

  /* ====== STATE HIỂN THỊ ====== */

  if (loading && !trialCourse) {
    return (
      <main className="trial-lesson-page">
        <div className="trial-loading">Đang tải chương học thử…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="trial-lesson-page">
        <div className="trial-error">
          Lỗi tải bài học thử: {error.message || String(error)}
        </div>
      </main>
    );
  }

  if (!trialCourse || !trialLessons.length) {
    return (
      <main className="trial-lesson-page">
        <div className="trial-empty">Không tìm thấy nội dung học thử.</div>
      </main>
    );
  }

  // tìm index để hiển thị "Bài 1, Bài 2..."
  const activeLessonIndex = activeLesson
    ? trialLessons.findIndex((l) => l.id === activeLesson.id)
    : -1;

  return (
    <main className="trial-lesson-page">
      {/* Breadcrumb */}
      <div className="trial-breadcrumb">
        <Link to={`/course/${courseId}`} className="crumb-link">
          Khóa học #{courseId}
        </Link>
        <span>›</span>
        <span>Học thử</span>
      </div>

      {/* Header */}
      <header className="trial-header">
        <div>
          <p className="trial-course-label">Khóa học giới thiệu</p>
          <h1>{trialCourse.title}</h1>
        </div>
        <span className="trial-badge">Học thử miễn phí</span>
      </header>

      {/* MAIN 2 CỘT */}
      <div className="trial-main">
        {/* LEFT: content của section đang chọn */}
        <div className="trial-main-left">
          <div className="viewer-card">
            {activeLesson && (
              <p className="viewer-lesson-label">
                Bài {activeLessonIndex >= 0 ? activeLessonIndex + 1 : ""} ·{" "}
                {activeLesson.title}
              </p>
            )}

            {activeSection && (
              <div className="viewer-section-title">
                <span>{activeSection.title}</span>
              </div>
            )}

            {activeSection ? (
              renderSectionContents(activeSection)
            ) : (
              <div className="viewer-empty">Chưa có phần nào để hiển thị.</div>
            )}
          </div>
        </div>

        {/* RIGHT: danh sách lesson + section */}
        <aside className="trial-main-right">
          <div className="side-panel">
            <div className="side-header">
              <p className="side-label">Nội dung chương học thử</p>
              {trialLessons.length > 1 && (
                <span className="trial-sidebar-count">
                  {trialLessons.length} bài học
                </span>
              )}
            </div>

            <div className="side-sections">
              {trialLessons.map((lesson, lIdx) => {
                const isActiveLesson = lesson.id === activeLessonId;

                return (
                  <div
                    key={lesson.id}
                    className={`side-section ${
                      isActiveLesson ? "is-active" : ""
                    }`}
                  >
                    {/* Header lesson */}
                    <button
                      type="button"
                      className="side-section-header"
                      onClick={() => {
                        setActiveLessonId(lesson.id);
                        const firstSection = lesson.sections?.[0];
                        setActiveSectionId(
                          firstSection?.id || firstSection?.sectionId || null
                        );
                      }}
                    >
                      <span className="dot" />
                      <div className="side-section-text">
                        <span className="title">
                          Bài {lIdx + 1}: {lesson.title}
                        </span>
                        <span className="meta">
                          {lesson.sections?.length
                            ? `${lesson.sections.length} phần`
                            : "Chưa có phần"}
                        </span>
                      </div>
                    </button>

                    {/* Danh sách section trong lesson */}
                    {lesson.sections && lesson.sections.length > 0 && (
                      <ul className="side-contents">
                        {lesson.sections.map((section) => {
                          const sid = section.id || section.sectionId;
                          const isActiveSection = sid === activeSectionId;
                          return (
                            <li key={sid}>
                              <button
                                type="button"
                                className={`side-content-item ${
                                  isActiveSection ? "is-active" : ""
                                }`}
                                onClick={() => {
                                  setActiveLessonId(lesson.id);
                                  setActiveSectionId(sid);
                                }}
                              >
                                <span className="content-type">Phần</span>
                                <span className="content-title">
                                  {section.title}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Quiz trial (nếu lesson đang chọn có quizId) */}
      {activeLesson?.quizId && (
        <section className="trial-quiz">
          <h2 className="trial-quiz-title">
            Bài kiểm tra thử cho: {activeLesson.title}
          </h2>
          {quizError && <p className="trial-quiz-error">{quizError}</p>}
          <button
            type="button"
            className="primary-btn"
            disabled={quizLoading}
            onClick={handleStartTrialQuiz}
          >
            {quizLoading ? "Đang mở quiz..." : "Làm bài quiz thử"}
          </button>
        </section>
      )}

      {/* Flashcard Modal */}
      <TrialFlashcardModal
        open={flashcardModalOpen}
        onClose={() => setFlashcardModalOpen(false)}
        sectionTitle={selectedFlashcardContent?.sectionTitle}
        sectionContentId={selectedFlashcardContent?.sectionContentId}
      />
    </main>
  );
};

export default CourseTrialLesson;
