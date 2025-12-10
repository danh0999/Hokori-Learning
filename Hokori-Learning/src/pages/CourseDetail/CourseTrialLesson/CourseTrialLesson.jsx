// src/pages/CourseDetail/CourseTrialLesson/CourseTrialLesson.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import "./CourseTrialLesson.scss";

import api from "../../../configs/axios.js";
import { buildFileUrl } from "../../../utils/fileUrl.js";

/* =========================================
   Helper: unwrap response { success, data }
========================================= */
const unwrap = (res) =>
  res?.data && typeof res.data === "object" && "data" in res.data
    ? res.data.data
    : res.data;

/* =========================================
   Flashcard Modal cho trial (giống bản cũ)
========================================= */
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

/* =========================================
   Main Trial Lesson Page (chapter-level)
========================================= */
const CourseTrialLesson = () => {
  const { courseId, chapterId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Tree theo course (chapter trial + lessons)
  const [loadingTree, setLoadingTree] = useState(true);
  const [treeError, setTreeError] = useState(null);
  const [trialCourse, setTrialCourse] = useState(null);
  const [trialChapter, setTrialChapter] = useState(null);
  const [trialLessons, setTrialLessons] = useState([]);

  // Lesson & section & content đang active
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [activeContentId, setActiveContentId] = useState(null);

  // Chi tiết lesson (trial-detail)
  const [lessonDetail, setLessonDetail] = useState(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState(null);

  // Flashcard
  const [flashcardModalOpen, setFlashcardModalOpen] = useState(false);
  const [selectedFlashcardContent, setSelectedFlashcardContent] =
    useState(null);

  // Quiz (dùng endpoint learner quiz)
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState(null);

  /* --------------------------
     1. Check login + trial tree
  -------------------------- */
  useEffect(() => {
    const fetchTrialTree = async () => {
      // login kiểm tra ở đây luôn
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

      setLoadingTree(true);
      setTreeError(null);

      try {
        const res = await api.get(`/courses/${courseId}/trial-tree`);
        const data = unwrap(res);

        setTrialCourse(data);

        const chapters = Array.isArray(data?.chapters) ? data.chapters : [];
        if (!chapters.length) {
          throw new Error("Khóa học chưa cấu hình chương học thử.");
        }

        // Ưu tiên isTrial, sau đó mới so sánh với chapterId trên URL, cuối cùng fallback chương đầu
        let chap =
          chapters.find((c) => c.isTrial) ||
          chapters.find(
            (c) =>
              String(c.id) === String(chapterId) ||
              String(c.chapterId) === String(chapterId)
          ) ||
          chapters[0];

        setTrialChapter(chap);

        const lessons = Array.isArray(chap.lessons) ? chap.lessons : [];
        if (!lessons.length) {
          throw new Error("Chương học thử chưa có bài học.");
        }

        setTrialLessons(lessons);

        // Bài active ban đầu là bài 1
        const firstLesson = lessons[0];
        const lId = firstLesson.id || firstLesson.lessonId;
        setActiveLessonId(lId || null);
      } catch (err) {
        console.error("Error fetching trial-tree", err);
        setTreeError(err);
      } finally {
        setLoadingTree(false);
      }
    };

    fetchTrialTree();
  }, [courseId, chapterId, navigate, location.pathname]);

  /* --------------------------
     2. Lấy trial-detail theo lessonId
  -------------------------- */
  useEffect(() => {
    if (!activeLessonId) {
      setLessonDetail(null);
      setActiveSectionId(null);
      setActiveContentId(null);
      return;
    }

    const fetchLessonDetail = async () => {
      setLessonLoading(true);
      setLessonError(null);
      setLessonDetail(null);
      setQuizError(null);

      try {
        const res = await api.get(
          `/courses/lessons/${activeLessonId}/trial-detail`
        );
        const detail = unwrap(res);
        setLessonDetail(detail);

        // Chọn default section + content cho lesson này
        if (Array.isArray(detail.sections) && detail.sections.length) {
          // nếu đang có activeSectionId thuộc lesson này thì ưu tiên, không thì lấy section đầu
          const sectionToUse =
            detail.sections.find(
              (s) =>
                String(s.sectionId) === String(activeSectionId) ||
                String(s.id) === String(activeSectionId)
            ) || detail.sections[0];

          const secId = sectionToUse.sectionId || sectionToUse.id;
          setActiveSectionId(secId);

          const contentsArr = Array.isArray(sectionToUse.contents)
            ? sectionToUse.contents
            : [];
          const firstContent = contentsArr[0];

          setActiveContentId(
            firstContent ? firstContent.contentId || firstContent.id : null
          );
        } else {
          setActiveSectionId(null);
          setActiveContentId(null);
        }
      } catch (err) {
        console.error("Error fetching trial-detail", err);
        setLessonError(err);
      } finally {
        setLessonLoading(false);
      }
    };

    fetchLessonDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLessonId]);

  /* --------------------------
     3. Tính section & content đang active
  -------------------------- */
  const activeSection = useMemo(() => {
    if (!lessonDetail?.sections?.length) return null;
    if (!activeSectionId) return lessonDetail.sections[0];

    return (
      lessonDetail.sections.find(
        (s) =>
          String(s.sectionId) === String(activeSectionId) ||
          String(s.id) === String(activeSectionId)
      ) || lessonDetail.sections[0]
    );
  }, [lessonDetail, activeSectionId]);

  const activeContent = useMemo(() => {
    if (!activeSection || !Array.isArray(activeSection.contents)) return null;
    if (!activeSection.contents.length) return null;

    if (!activeContentId) return activeSection.contents[0];

    return (
      activeSection.contents.find(
        (c) =>
          String(c.contentId) === String(activeContentId) ||
          String(c.id) === String(activeContentId)
      ) || activeSection.contents[0]
    );
  }, [activeSection, activeContentId]);

  /* --------------------------
     4. Flashcard handler
  -------------------------- */
  const handleOpenFlashcard = (section, content) => {
    setSelectedFlashcardContent({
      sectionTitle: section.title,
      sectionContentId: content.contentId || content.id,
    });
    setFlashcardModalOpen(true);
  };

  /* --------------------------
     5. Render 1 content (LEFT)
  -------------------------- */
  const renderActiveContentBlock = (section, content) => {
    if (!section || !content) {
      return (
        <div className="viewer-empty">
          Phần này chưa có nội dung để học thử.
        </div>
      );
    }

    const key = `${section.sectionId || section.id}-${
      content.contentId || content.id
    }`;

    // ASSET (video / ảnh)
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

    // FLASHCARD_SET mở modal
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

    // Fallback
    return (
      <div key={key} className="viewer-empty">
        Nội dung thử (type: {content.contentFormat}) chưa được hỗ trợ hiển thị.
      </div>
    );
  };

  /* --------------------------
     6. Start quiz cho lesson hiện tại
  -------------------------- */
  const handleStartTrialQuiz = async () => {
    const lId = lessonDetail?.lessonId || activeLessonId;
    if (!lId) return;

    setQuizLoading(true);
    setQuizError(null);

    try {
      // check info
      await api.get(`/learner/lessons/${lId}/quiz/info`);

      const startRes = await api.post(
        `/learner/lessons/${lId}/quiz/attempts/start`,
        { forceNew: false }
      );

      const attempt = unwrap(startRes);
      const attemptId = attempt?.id || attempt?.attemptId;

      if (!attemptId) {
        setQuizError("Không xác định được attempt của quiz.");
        return;
      }

      navigate(`/learner/trial-quiz/${lId}`);
    } catch (err) {
      console.error("Error starting trial quiz", err);
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        "Không bắt đầu được quiz. Vui lòng thử lại.";

      if (status === 401) {
        navigate("/login", {
          state: { redirectTo: location.pathname },
          replace: true,
        });
        return;
      }

      if (status === 404 || status === 400) {
        setQuizError("Bài học này hiện chưa có quiz.");
      } else {
        setQuizError(msg);
      }
    } finally {
      setQuizLoading(false);
    }
  };

  /* --------------------------
     7. State hiển thị tổng
  -------------------------- */
  if (loadingTree && !trialCourse) {
    return (
      <main className="trial-lesson-page">
        <div className="trial-loading">Đang tải chương học thử…</div>
      </main>
    );
  }

  if (treeError) {
    return (
      <main className="trial-lesson-page">
        <div className="trial-error">
          Lỗi tải học thử: {treeError.message || String(treeError)}
        </div>
      </main>
    );
  }

  if (!trialCourse || !trialChapter || !trialLessons.length) {
    return (
      <main className="trial-lesson-page">
        <div className="trial-empty">Không tìm thấy nội dung học thử.</div>
      </main>
    );
  }

  const activeLesson = trialLessons.find(
    (l) =>
      String(l.id) === String(activeLessonId) ||
      String(l.lessonId) === String(activeLessonId)
  );
  const activeLessonIndex = activeLesson
    ? trialLessons.findIndex(
        (l) =>
          String(l.id) === String(activeLessonId) ||
          String(l.lessonId) === String(activeLessonId)
      )
    : -1;

  return (
    <main className="trial-lesson-page">
      {/* Breadcrumb */}
      <div className="trial-breadcrumb">
        <Link to={`/course/${courseId}`} className="crumb-link">
          {trialCourse.title}
        </Link>
        <span>›</span>
        <span>{trialChapter.title}</span>
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
        {/* LEFT: viewer */}
        <div className="trial-main-left">
          <div className="viewer-card">
            {activeLesson && (
              <p className="viewer-lesson-label">{activeLesson.title}</p>
            )}

            {activeSection && (
              <div className="viewer-section-title">
                <span>{activeSection.title}</span>
              </div>
            )}

            {lessonLoading && (
              <div className="viewer-loading">Đang tải nội dung bài học…</div>
            )}

            {lessonError && (
              <div className="viewer-error">
                Lỗi tải bài học: {lessonError.message || String(lessonError)}
              </div>
            )}

            {!lessonLoading &&
              !lessonError &&
              activeSection &&
              activeContent &&
              renderActiveContentBlock(activeSection, activeContent)}

            {!lessonLoading &&
              !lessonError &&
              (!activeSection || !activeContent) && (
                <div className="viewer-empty">
                  Chưa có phần nào để hiển thị cho bài học này.
                </div>
              )}
          </div>
        </div>

        {/* RIGHT: sidebar lesson -> section -> content */}
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
                const lId = lesson.id || lesson.lessonId;
                const isActiveLesson = String(lId) === String(activeLessonId);

                const sectionsForThisLesson =
                  isActiveLesson && lessonDetail?.sections
                    ? lessonDetail.sections
                    : Array.isArray(lesson.sections)
                    ? lesson.sections
                    : [];

                return (
                  <div
                    key={lId}
                    className={`side-section ${
                      isActiveLesson ? "is-active" : ""
                    }`}
                  >
                    {/* Lesson header: bấm để load trial-detail */}
                    <button
                      type="button"
                      className="side-section-header"
                      onClick={() => {
                        if (String(activeLessonId) === String(lId)) return;
                        setActiveLessonId(lId);
                        setActiveSectionId(null);
                        setActiveContentId(null);
                        setLessonDetail(null);
                        setLessonError(null);
                        setQuizError(null);
                      }}
                    >
                      <span className="dot" />
                      <div className="side-section-text">
                        <span className="title">{lesson.title}</span>
                        <span className="meta">
                          {Array.isArray(sectionsForThisLesson)
                            ? `${sectionsForThisLesson.length} phần`
                            : "Chưa có phần"}
                        </span>
                      </div>
                    </button>

                    {/* Section_title (không bấm được) + list content */}
                    {sectionsForThisLesson.length > 0 && (
                      <div className="side-lesson-body">
                        {sectionsForThisLesson.map((section) => {
                          const sid = section.sectionId || section.id;
                          const contents = Array.isArray(section.contents)
                            ? section.contents
                            : [];

                          return (
                            <div key={sid} className="side-section-block">
                              {/* section_title (label, không click) */}
                              <div className="side-section-title-row">
                                <span className="section-dot" />
                                <span className="section-title-text">
                                  {section.title}
                                </span>
                              </div>

                              {/* list content */}
                              {contents.length > 0 && (
                                <ul className="side-contents">
                                  {contents.map((content) => {
                                    const cid = content.contentId || content.id;
                                    const isActiveContent =
                                      isActiveLesson &&
                                      String(sid) === String(activeSectionId) &&
                                      String(cid) === String(activeContentId);

                                    let contentLabel = content.title || "";
                                    if (!contentLabel || !contentLabel.trim()) {
                                      if (content.contentFormat === "ASSET") {
                                        contentLabel = "Tài liệu xem";
                                      } else if (
                                        content.contentFormat === "RICH_TEXT"
                                      ) {
                                        contentLabel = "Lý thuyết";
                                      } else if (
                                        content.contentFormat ===
                                        "FLASHCARD_SET"
                                      ) {
                                        contentLabel = "Flashcard từ vựng";
                                      } else {
                                        contentLabel =
                                          content.contentFormat || "Nội dung";
                                      }
                                    }

                                    let typeTag = "";
                                    if (content.contentFormat === "ASSET")
                                      typeTag = "ASSET";
                                    else if (
                                      content.contentFormat === "RICH_TEXT"
                                    )
                                      typeTag = "TEXT";
                                    else if (
                                      content.contentFormat === "FLASHCARD_SET"
                                    )
                                      typeTag = "CARD";
                                    else typeTag = content.contentFormat || "";

                                    return (
                                      <li key={cid}>
                                        <button
                                          type="button"
                                          className={`side-content-item ${
                                            isActiveContent ? "is-active" : ""
                                          }`}
                                          onClick={() => {
                                            setActiveLessonId(lId);
                                            setActiveSectionId(sid);
                                            setActiveContentId(cid);
                                          }}
                                        >
                                          <span className="content-title">
                                            {contentLabel}
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
                    )}

                    {isActiveLesson && lessonLoading && (
                      <p className="side-loading">Đang tải chi tiết bài học…</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* QUIZ: chỉ render nếu lessonDetail có quizId */}
      {lessonDetail?.quizId && (
        <section className="trial-quiz" id="trial-quiz">
          <h2 className="trial-quiz-heading">
            Bài kiểm tra cho: {lessonDetail.title}
          </h2>
          <p className="trial-quiz-note">
            Đây là quiz của bài học này. Bạn có thể làm thử, hệ thống sẽ dùng
            flow quiz bình thường.
          </p>

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
