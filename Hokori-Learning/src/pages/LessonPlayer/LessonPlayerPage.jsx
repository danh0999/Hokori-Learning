// src/pages/LessonPlayer/LessonPlayerPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../configs/axios";
import styles from "./LessonPlayerPage.module.scss";
import { buildFileUrl } from "../../utils/fileUrl";

// helper detect video / image
const VIDEO_EXTS = [".mp4", ".mov", ".m4v", ".webm", ".ogg"];
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

const getExt = (path = "") => {
  const qIndex = path.indexOf("?");
  const clean = qIndex >= 0 ? path.slice(0, qIndex) : path;
  const dotIndex = clean.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return clean.slice(dotIndex).toLowerCase();
};

const isVideoAsset = (path) => VIDEO_EXTS.includes(getExt(path));
const isImageAsset = (path) => IMAGE_EXTS.includes(getExt(path));

export default function LessonPlayerPage() {
  const { courseId, slug, lessonId, contentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [lesson, setLesson] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [errorLesson, setErrorLesson] = useState(null);

  const [courseTree, setCourseTree] = useState(null);
  const [loadingTree, setLoadingTree] = useState(true);
  const [errorTree, setErrorTree] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [openChapterIds, setOpenChapterIds] = useState(new Set());
  const [openLessonIds, setOpenLessonIds] = useState(new Set());

  // FLASHCARD
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [flashcardsError, setFlashcardsError] = useState(null);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  // QUIZ – view & data
  // activeView: "content" | "quiz-info"
  const [activeView, setActiveView] = useState("content");
  const [quizLessonId, setQuizLessonId] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState(null);

  const chapterOrderIndexFromState = location.state?.chapterOrderIndex ?? 1;

  const numericLessonId = Number(lessonId);
  const numericContentId = Number(contentId);

  /* ===========================
     GLOBAL SEQUENCE (CẢ KHÓA)
  ============================ */
  const globalSequence = useMemo(() => {
    if (!courseTree?.chapters) return [];

    const items = [];
    courseTree.chapters.forEach((ch) => {
      ch.lessons?.forEach((ls) => {
        ls.sections?.forEach((sec) => {
          sec.contents?.forEach((ct) => {
            items.push({
              chapterId: ch.chapterId,
              chapterOrderIndex: ch.orderIndex,
              lessonId: ls.lessonId,
              contentId: ct.contentId,
            });
          });
        });
      });
    });

    return items;
  }, [courseTree]);

  const currentGlobalIndex = useMemo(() => {
    if (!globalSequence.length) return -1;
    return globalSequence.findIndex(
      (item) =>
        item.lessonId === numericLessonId && item.contentId === numericContentId
    );
  }, [globalSequence, numericLessonId, numericContentId]);

  const isFirstGlobal = !globalSequence.length || currentGlobalIndex <= 0;
  const isLastGlobal =
    !globalSequence.length || currentGlobalIndex === globalSequence.length - 1;

  /* ===========================
     FETCH COURSE TREE CHO SIDEBAR
  ============================ */
  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoadingTree(true);
        const res = await api.get(`/learner/courses/${courseId}/learning-tree`);
        const tree = res.data;
        setCourseTree(tree);
        setErrorTree(null);

        const chapters = tree.chapters || [];

        const currentChapter = chapters.find((ch) =>
          ch.lessons?.some((ls) => ls.lessonId === numericLessonId)
        );

        if (currentChapter) {
          const chapterSet = new Set([currentChapter.chapterId]);
          setOpenChapterIds(chapterSet);

          const currentLesson =
            currentChapter.lessons?.find(
              (ls) => ls.lessonId === numericLessonId
            ) || currentChapter.lessons?.[0];

          const lessonSet = new Set();
          if (currentLesson?.lessonId) lessonSet.add(currentLesson.lessonId);
          setOpenLessonIds(lessonSet);
        } else if (chapters[0]) {
          const firstChapter = chapters[0];
          setOpenChapterIds(new Set([firstChapter.chapterId]));
          if (firstChapter.lessons?.[0]?.lessonId) {
            setOpenLessonIds(new Set([firstChapter.lessons[0].lessonId]));
          }
        }
      } catch (err) {
        console.error(err);
        setErrorTree("Không thể tải nội dung khóa học");
      } finally {
        setLoadingTree(false);
      }
    };

    fetchTree();
  }, [courseId, numericLessonId]);

  /* ===========================
     FETCH LESSON DETAIL + CONTENT PROGRESS
  ============================ */
  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setLoadingLesson(true);

        const [detailRes, contentsRes] = await Promise.all([
          api.get(`/learner/lessons/${lessonId}/detail`),
          api.get(`/learner/lessons/${lessonId}/contents`),
        ]);

        const detail = detailRes.data;
        const contentsProgress = contentsRes.data || [];

        const progressMap = new Map(
          contentsProgress.map((c) => [c.contentId, c])
        );

        const lessonWithProgress = {
          ...detail,
          sections: detail.sections?.map((sec) => ({
            ...sec,
            contents: sec.contents?.map((ct) => {
              const key = ct.contentId ?? ct.id;
              const progress = progressMap.get(key);
              return {
                ...ct,
                contentId: key,
                ...(progress || {}),
              };
            }),
          })),
        };

        setLesson(lessonWithProgress);
        setErrorLesson(null);
      } catch (err) {
        console.error(err);
        setErrorLesson("Không thể tải nội dung bài học");
      } finally {
        setLoadingLesson(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  // mỗi lần đổi lesson/content → về view "content"
  useEffect(() => {
    setActiveView("content");
    setQuizLessonId(null);
  }, [numericLessonId, numericContentId]);

  /* ===========================
     FLATTEN CONTENTS TRONG 1 LESSON
  ============================ */
  const flatContents = useMemo(() => {
    if (!lesson) return [];
    const items = [];
    lesson.sections?.forEach((sec) => {
      sec.contents?.forEach((ct) => {
        items.push({
          sectionTitle: sec.title,
          ...ct,
        });
      });
    });
    return items;
  }, [lesson]);

  useEffect(() => {
    if (!flatContents.length) return;
    const idx = flatContents.findIndex((c) => c.contentId === numericContentId);
    setCurrentIndex(idx >= 0 ? idx : 0);
  }, [flatContents, numericContentId]);

  const activeContent =
    flatContents.length > 0 ? flatContents[currentIndex] : null;

  /* ===========================
     NAVIGATION
  ============================ */
  const goBackToTree = () => {
    navigate(
      `/learn/${courseId}/${slug}/home/chapter/${chapterOrderIndexFromState}`
    );
  };

  const updateUrlForContent = (targetLessonId, ct, chapterOrderIndex) => {
    if (!ct) return;
    navigate(
      `/learn/${courseId}/${slug}/lesson/${targetLessonId}/content/${ct.contentId}`,
      {
        replace: false,
        state: { chapterOrderIndex },
      }
    );
  };

  const goPrev = () => {
    if (currentGlobalIndex <= 0) return;
    const target = globalSequence[currentGlobalIndex - 1];
    updateUrlForContent(
      target.lessonId,
      { contentId: target.contentId },
      target.chapterOrderIndex
    );
  };

  const goNext = () => {
    if (
      !globalSequence.length ||
      currentGlobalIndex === globalSequence.length - 1
    ) {
      return;
    }
    const target = globalSequence[currentGlobalIndex + 1];
    updateUrlForContent(
      target.lessonId,
      { contentId: target.contentId },
      target.chapterOrderIndex
    );
  };

  /* ===========================
     MARK AS COMPLETED
  ============================ */
  const handleMarkCompleted = async () => {
    if (!activeContent?.contentId) return;

    try {
      await api.patch(`/learner/contents/${activeContent.contentId}/progress`, {
        lastPositionSec: activeContent.lastPositionSec || 0,
        isCompleted: true,
      });

      // Cập nhật lesson hiện tại
      setLesson((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections?.map((sec) => ({
            ...sec,
            contents: sec.contents?.map((ct) =>
              ct.contentId === activeContent.contentId
                ? { ...ct, isCompleted: true }
                : ct
            ),
          })),
        };
      });

      // Cập nhật courseTree (sidebar)
      setCourseTree((prev) => {
        if (!prev?.chapters) return prev;
        return {
          ...prev,
          chapters: prev.chapters.map((ch) => ({
            ...ch,
            lessons: ch.lessons?.map((ls) => ({
              ...ls,
              sections: ls.sections?.map((sec) => ({
                ...sec,
                contents: sec.contents?.map((ct) =>
                  ct.contentId === activeContent.contentId
                    ? { ...ct, isCompleted: true }
                    : ct
                ),
              })),
            })),
          })),
        };
      });
    } catch (err) {
      console.error("Không thể cập nhật tiến độ content:", err);
    }
  };

  /* ===========================
     SIDEBAR HELPERS
  ============================ */
  const getLessonContents = (ls) => {
    const arr = [];
    ls.sections?.forEach((sec) => {
      sec.contents?.forEach((ct) => {
        arr.push({
          lessonId: ls.lessonId,
          lessonTitle: ls.title,
          contentId: ct.contentId,
          contentFormat: ct.contentFormat,
          isCompleted: ct.isCompleted,
          sectionTitle: sec.title,
        });
      });
    });
    return arr;
  };

  const toggleChapter = (chapterId) => {
    setOpenChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const toggleLesson = (lessonIdToggle) => {
    setOpenLessonIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonIdToggle)) next.delete(lessonIdToggle);
      else next.add(lessonIdToggle);
      return next;
    });
  };

  const handleSidebarContentClick = (
    lessonIdTarget,
    contentIdTarget,
    chapterOrderIndex
  ) => {
    setActiveView("content");
    setQuizLessonId(null);
    updateUrlForContent(
      lessonIdTarget,
      { contentId: contentIdTarget },
      chapterOrderIndex
    );
  };

  /* ===========================
     QUIZ OVERVIEW
  ============================ */

  const openQuizOverview = (lessonIdForQuiz) => {
    setActiveView("quiz-info");
    setQuizLessonId(lessonIdForQuiz);
  };

  // khi đang ở view quiz-info + có quizLessonId → load info + lịch sử
  // khi đang ở view quiz-info + có quizLessonId → load info + lịch sử
  useEffect(() => {
    if (activeView !== "quiz-info" || !quizLessonId) return;

    let cancelled = false;

    const fetchQuizOverview = async () => {
      try {
        setQuizLoading(true);
        setQuizError(null);

        const [infoRes, attemptsRes] = await Promise.all([
          api.get(`/learner/lessons/${quizLessonId}/quiz/info`),
          api.get(`/learner/lessons/${quizLessonId}/quiz/attempts`),
        ]);

        if (cancelled) return;

        console.log("quiz info", infoRes.data);
        console.log("quiz attempts", attemptsRes.data);

        // unwrap wrapper { success, message, data }
        const infoWrapper = infoRes.data || {};
        const attemptsWrapper = attemptsRes.data || {};

        const infoData = infoWrapper.data || null;

        // attempts có thể là data: [...] hoặc data: { items: [...] }
        let attemptsData = attemptsWrapper.data || [];
        if (Array.isArray(attemptsData.items)) {
          attemptsData = attemptsData.items;
        }

        setQuizInfo(infoData);
        setQuizAttempts(Array.isArray(attemptsData) ? attemptsData : []);
      } catch (err) {
        console.error("Không thể tải thông tin quiz:", err);
        if (!cancelled) {
          setQuizError("Không thể tải thông tin quiz của bài này");
        }
      } finally {
        if (!cancelled) setQuizLoading(false);
      }
    };

    fetchQuizOverview();

    return () => {
      cancelled = true;
    };
  }, [activeView, quizLessonId]);

  const handleStartQuiz = async () => {
    if (!quizLessonId) return;
    try {
      setQuizLoading(true);

      const res = await api.post(
        `/learner/lessons/${quizLessonId}/quiz/attempts/start`
      );

      console.log("start quiz res", res.data); // debug cho chắc

      // unwrap wrapper { success, message, data }
      const wrapper = res.data || {};
      const attempt = wrapper.data || wrapper; // nếu BE sau này bỏ wrapper vẫn chạy

      const attemptId = attempt.attemptId || attempt.id;

      if (!attemptId) {
        console.error("Không tìm thấy attemptId từ API start", attempt);
        setQuizError("Không lấy được attemptId từ server");
        return;
      }

      navigate(
        `/learn/${courseId}/${slug}/lesson/${quizLessonId}/quiz/attempt/${attemptId}`
      );
    } catch (err) {
      console.error("Lỗi khi bắt đầu quiz:", err);
      setQuizError("Không thể bắt đầu làm quiz. Vui lòng thử lại.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleViewAttemptDetail = (attemptId) => {
    if (!quizLessonId || !attemptId) return;
    navigate(
      `/learn/${courseId}/${slug}/lesson/${quizLessonId}/quiz/attempt/${attemptId}`
    );
  };

  //=====FLASHCARD==========
  useEffect(() => {
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
  }, [activeContent?.contentId]);

  useEffect(() => {
    if (
      !isFlashcardModalOpen ||
      !activeContent?.contentId ||
      activeContent?.contentFormat !== "FLASHCARD_SET"
    ) {
      return;
    }

    let cancelled = false;

    const fetchFlashcards = async () => {
      try {
        setFlashcardsLoading(true);
        setFlashcardsError(null);

        // 1. Lấy setId
        let setId = activeContent.flashcardSetId;

        // Nếu content chưa có flashcardSetId, gọi learner/contents/.../flashcard-set
        if (!setId) {
          const resSet = await api.get(
            `/learner/contents/${activeContent.contentId}/flashcard-set`
          );
          const setData = resSet.data;
          setId = setData?.id || setData?.setId;

          if (!setId) {
            throw new Error("Không tìm thấy flashcard set cho content này");
          }
        }

        // 2. Gọi /api/flashcards/sets/{setId}/cards
        const resCards = await api.get(`/flashcards/sets/${setId}/cards`);

        if (!cancelled) {
          setFlashcards(resCards.data || []);
          setFlashcardIndex(0);
          setFlashcardFlipped(false);
        }
      } catch (err) {
        console.error("Không thể tải flashcard:", err);
        if (!cancelled) {
          setFlashcardsError("Không thể tải flashcard");
        }
      } finally {
        if (!cancelled) setFlashcardsLoading(false);
      }
    };

    fetchFlashcards();

    return () => {
      cancelled = true;
    };
  }, [
    isFlashcardModalOpen,
    activeContent?.contentId,
    activeContent?.contentFormat,
    activeContent?.flashcardSetId,
  ]);
  const openFlashcardModal = () => {
    setIsFlashcardModalOpen(true);
  };

  const closeFlashcardModal = () => {
    setIsFlashcardModalOpen(false);
  };

  const toggleFlashcardFlip = () => {
    setFlashcardFlipped((prev) => !prev);
  };

  const goPrevFlashcard = () => {
    if (!flashcards || flashcards.length === 0) return;

    setFlashcardIndex((prev) => {
      const next = prev - 1;
      // nếu nhỏ hơn 0 thì quay về thẻ cuối
      return next < 0 ? flashcards.length - 1 : next;
    });

    setFlashcardFlipped(false);
  };

  const goNextFlashcard = () => {
    if (!flashcards || flashcards.length === 0) return;

    setFlashcardIndex((prev) => {
      const next = prev + 1;
      // nếu quá thẻ cuối thì quay về 0
      return next >= flashcards.length ? 0 : next;
    });

    // quay về mặt trước
    setFlashcardFlipped(false);
  };

  const currentFlashcard =
    flashcards.length > 0 ? flashcards[flashcardIndex] : null;

  /* ===========================
     RENDER
  ============================ */

  if (loadingLesson || loadingTree) {
    return <div className={styles.loading}>Đang tải...</div>;
  }

  if (errorLesson || !lesson) {
    return (
      <div className={styles.error}>{errorLesson || "Không có dữ liệu"}</div>
    );
  }

  const isCurrentCompleted = !!activeContent?.isCompleted;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.mainLayout}>
          {/* ========== SIDEBAR FULL TREE ========== */}
          <aside className={styles.leftNav}>
            <button
              className={styles.courseHeader}
              type="button"
              onClick={goBackToTree}
            >
              <span className={styles.courseHeaderTitle}>
                {courseTree?.courseTitle || "Khóa học"}
              </span>
            </button>

            {errorTree && (
              <div className={styles.sidebarError}>{errorTree}</div>
            )}

            {!errorTree && (
              <div className={styles.chapterList}>
                {courseTree?.chapters?.map((ch) => {
                  const isChapterOpen = openChapterIds.has(ch.chapterId);
                  const chapterOrderIndex = ch.orderIndex;

                  // TÍNH TRẠNG THÁI HOÀN THÀNH CỦA CHAPTER
                  const lessonsInChapter = ch.lessons || [];
                  const isChapterCompleted =
                    lessonsInChapter.length > 0 &&
                    lessonsInChapter.every((ls) => {
                      const lessonItems = getLessonContents(ls);
                      return (
                        lessonItems.length > 0 &&
                        lessonItems.every((item) => item.isCompleted)
                      );
                    });

                  return (
                    <div key={ch.chapterId} className={styles.chapterItem}>
                      <button
                        type="button"
                        className={styles.chapterHeader}
                        onClick={() => toggleChapter(ch.chapterId)}
                      >
                        <div className={styles.chapterHeaderText}>
                          <span className={styles.chapterTitle}>
                            {ch.title}
                          </span>
                        </div>

                        <div className={styles.chapterHeaderRight}>
                          {isChapterCompleted && (
                            <span className={styles.chapterStatusIcon}>✓</span>
                          )}
                          <span
                            className={`${styles.chapterArrow} ${
                              isChapterOpen ? styles.chapterArrowOpen : ""
                            }`}
                          >
                            ▾
                          </span>
                        </div>
                      </button>

                      {isChapterOpen && (
                        <div className={styles.lessonList}>
                          {ch.lessons?.map((ls) => {
                            const isLessonOpen = openLessonIds.has(ls.lessonId);

                            // DÙNG getLessonContents CHO LESSON
                            const contents = getLessonContents(ls);
                            const hasContents = contents.length > 0;
                            const isLessonCompleted =
                              hasContents &&
                              contents.every((c) => c.isCompleted);

                            const isQuizActive =
                              activeView === "quiz-info" &&
                              quizLessonId === ls.lessonId;

                            return (
                              <div
                                key={ls.lessonId}
                                className={styles.lessonItem}
                              >
                                <button
                                  type="button"
                                  className={styles.lessonHeader}
                                  onClick={() =>
                                    hasContents && toggleLesson(ls.lessonId)
                                  }
                                >
                                  <div className={styles.lessonHeaderMain}>
                                    <span className={styles.lessonTitleText}>
                                      {ls.title}
                                    </span>

                                    {isLessonCompleted && (
                                      <span className={styles.lessonStatusIcon}>
                                        ✓
                                      </span>
                                    )}
                                  </div>

                                  {hasContents && (
                                    <span
                                      className={`${styles.lessonArrow} ${
                                        isLessonOpen
                                          ? styles.lessonArrowOpen
                                          : ""
                                      }`}
                                    >
                                      ▾
                                    </span>
                                  )}
                                </button>

                                {isLessonOpen && (
                                  <ul className={styles.lessonContentList}>
                                    {/* các content */}
                                    {hasContents &&
                                      contents.map((item) => {
                                        const isActive =
                                          item.lessonId === numericLessonId &&
                                          item.contentId === numericContentId &&
                                          activeView === "content";

                                        return (
                                          <li
                                            key={`${item.lessonId}-${item.contentId}`}
                                            className={`${
                                              styles.lessonContentItem
                                            } ${
                                              isActive
                                                ? styles.lessonContentItemActive
                                                : ""
                                            }`}
                                            onClick={() =>
                                              handleSidebarContentClick(
                                                item.lessonId,
                                                item.contentId,
                                                chapterOrderIndex
                                              )
                                            }
                                          >
                                            <p
                                              className={
                                                styles.lessonContentTitle
                                              }
                                            >
                                              {item.contentFormat === "ASSET" &&
                                                "Video / tài liệu"}
                                              {item.contentFormat ===
                                                "RICH_TEXT" && "Bài đọc"}
                                              {item.contentFormat ===
                                                "FLASHCARD_SET" && "Từ vựng"}
                                            </p>
                                            <span
                                              className={
                                                styles.lessonContentSection
                                              }
                                            >
                                              {item.sectionTitle}
                                            </span>
                                            {item.isCompleted && (
                                              <span
                                                className={
                                                  styles.lessonContentDone
                                                }
                                              >
                                                ✓
                                              </span>
                                            )}
                                          </li>
                                        );
                                      })}

                                    {/* item Quiz – luôn hiện, nếu lesson chưa có quiz thì view sẽ báo "chưa có quiz" */}
                                    <li
                                      key={`${ls.lessonId}-quiz`}
                                      className={`${styles.lessonContentItem} ${
                                        isQuizActive
                                          ? styles.lessonContentItemActive
                                          : ""
                                      }`}
                                      onClick={() =>
                                        openQuizOverview(ls.lessonId)
                                      }
                                    >
                                      <p className={styles.lessonContentTitle}>
                                        Quiz
                                      </p>
                                      <span
                                        className={styles.lessonContentSection}
                                      >
                                        Luyện tập
                                      </span>
                                    </li>
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </aside>

          {/* ========== PLAYER PANEL ========== */}
          <section className={styles.playerPanel}>
            {activeView === "quiz-info" ? (
              // ------------ QUIZ OVERVIEW ------------
              <div className={styles.quizOverview}>
                <div className={styles.quizOverviewHeader}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => {
                      setActiveView("content");
                      setQuizLessonId(null);
                    }}
                  >
                    ← Quay lại nội dung bài học
                  </button>
                </div>

                {quizLoading && <p>Đang tải thông tin quiz...</p>}

                {quizError && <p className={styles.error}>{quizError}</p>}

                {!quizLoading && !quizError && !quizInfo && (
                  <p>Bài học này hiện chưa có quiz.</p>
                )}

                {!quizLoading && !quizError && quizInfo && (
                  <>
                    <h2 className={styles.quizTitle}>
                      {quizInfo.title || "Bài quiz"}
                    </h2>
                    {quizInfo.description && (
                      <p className={styles.quizDescription}>
                        {quizInfo.description}
                      </p>
                    )}

                    <div className={styles.quizMeta}>
                      {quizInfo.totalQuestions != null && (
                        <span>Số câu hỏi: {quizInfo.totalQuestions}</span>
                      )}
                      {quizInfo.timeLimitMinutes != null && (
                        <span>Thời gian: {quizInfo.timeLimitMinutes} phút</span>
                      )}
                      {quizInfo.maxAttempts != null && (
                        <span>Số lần làm tối đa: {quizInfo.maxAttempts}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      className={styles.primaryBtn}
                      disabled={quizLoading}
                      onClick={handleStartQuiz}
                    >
                      Bắt đầu làm bài
                    </button>

                    <hr className={styles.quizDivider} />

                    <h3 className={styles.quizHistoryTitle}>Lịch sử làm bài</h3>

                    {(!quizAttempts || quizAttempts.length === 0) && (
                      <p>Chưa có lần làm nào.</p>
                    )}

                    {quizAttempts && quizAttempts.length > 0 && (
                      <ul className={styles.quizAttemptList}>
                        {quizAttempts.map((attempt) => {
                          const status = (attempt.status || "").toUpperCase();
                          const isInProgress = status === "IN_PROGRESS";

                          return (
                            <li
                              key={attempt.attemptId || attempt.id}
                              className={styles.quizAttemptItem}
                            >
                              <div className={styles.quizAttemptMain}>
                                <span>
                                  Lần làm{" "}
                                  {attempt.attemptNumber ??
                                    attempt.attemptIndex ??
                                    ""}
                                </span>
                                {attempt.score != null &&
                                  attempt.totalQuestions != null && (
                                    <span>
                                      Điểm: {attempt.score}/
                                      {attempt.totalQuestions}
                                    </span>
                                  )}
                                {attempt.createdAt && (
                                  <span>
                                    Thời gian:{" "}
                                    {new Date(attempt.createdAt).toLocaleString(
                                      "vi-VN"
                                    )}
                                  </span>
                                )}
                                {attempt.status && (
                                  <span>Trạng thái: {attempt.status}</span>
                                )}
                              </div>

                              <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={() =>
                                  handleViewAttemptDetail(
                                    attempt.attemptId || attempt.id
                                  )
                                }
                              >
                                {isInProgress ? "Tiếp tục làm" : "Xem chi tiết"}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )}
              </div>
            ) : activeContent ? (
              // ------------ PLAYER CONTENT ------------
              <>
                <div className={styles.playerBody}>
                  {activeContent.contentFormat === "ASSET" && (
                    <div className={styles.assetWrapper}>
                      {isVideoAsset(activeContent.filePath) && (
                        <video
                          className={styles.video}
                          controls
                          src={buildFileUrl(activeContent.filePath)}
                        />
                      )}

                      {isImageAsset(activeContent.filePath) && (
                        <img
                          className={styles.image}
                          src={buildFileUrl(activeContent.filePath)}
                          alt={activeContent.sectionTitle || "Course asset"}
                        />
                      )}

                      {!isVideoAsset(activeContent.filePath) &&
                        !isImageAsset(activeContent.filePath) && (
                          <div className={styles.unknownAsset}>
                            <p>Tệp nội dung không phải video hoặc ảnh.</p>
                            <a
                              href={buildFileUrl(activeContent.filePath)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Mở tệp
                            </a>
                          </div>
                        )}
                    </div>
                  )}

                  {activeContent.contentFormat === "RICH_TEXT" && (
                    <article
                      className={styles.richText}
                      dangerouslySetInnerHTML={{
                        __html: activeContent.richText || "",
                      }}
                    />
                  )}

                  {activeContent.contentFormat === "FLASHCARD_SET" && (
                    <div className={styles.flashcardWrapper}>
                      <p>
                        Đây là tập flashcard cho phần{" "}
                        <strong>{activeContent.sectionTitle}</strong>.
                      </p>
                      <button
                        className={styles.primaryBtn}
                        type="button"
                        onClick={openFlashcardModal}
                      >
                        Bắt đầu học flashcard
                      </button>
                      <p className={styles.flashcardHint}>
                        Bấm nút để mở bộ thẻ. Trong cửa sổ, click vào thẻ để
                        lật.
                      </p>
                    </div>
                  )}
                </div>

                <div className={styles.playerFooter}>
                  <button
                    className={styles.secondaryBtn}
                    onClick={goPrev}
                    disabled={isFirstGlobal}
                  >
                    Nội dung trước
                  </button>

                  <button
                    className={styles.markBtn}
                    onClick={handleMarkCompleted}
                    disabled={isCurrentCompleted || !activeContent?.contentId}
                  >
                    {isCurrentCompleted ? "Đã hoàn thành" : "Đánh dấu đã học"}
                  </button>

                  <button
                    className={styles.primaryBtn}
                    onClick={goNext}
                    disabled={isLastGlobal}
                  >
                    Nội dung tiếp theo
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                Không tìm thấy nội dung cho bài học này.
              </div>
            )}
          </section>

          {/* FLASHCARD MODAL */}
          {isFlashcardModalOpen && (
            <div
              className={styles.flashcardModalOverlay}
              onClick={closeFlashcardModal}
            >
              <div
                className={styles.flashcardModal}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.flashcardModalHeader}>
                  <h3 className={styles.flashcardModalTitle}>
                    Bộ flashcard – {activeContent?.sectionTitle || "Từ vựng"}
                  </h3>
                  <button
                    type="button"
                    className={styles.flashcardCloseBtn}
                    onClick={closeFlashcardModal}
                  >
                    ×
                  </button>
                </div>

                <div className={styles.flashcardModalBody}>
                  {flashcardsLoading && <p>Đang tải flashcard...</p>}

                  {flashcardsError && (
                    <p className={styles.flashcardError}>{flashcardsError}</p>
                  )}

                  {!flashcardsLoading &&
                    !flashcardsError &&
                    !flashcards.length && <p>Chưa có thẻ nào trong bộ này.</p>}

                  {!flashcardsLoading &&
                    !flashcardsError &&
                    currentFlashcard && (
                      <>
                        {/* --- FLASHCARD CARD --- */}
                        <div className={styles.flashcardCardWrapper}>
                          <button
                            type="button"
                            className={styles.flashcardCard}
                            onClick={toggleFlashcardFlip}
                          >
                            <div
                              className={`${styles.flashcardInner} ${
                                flashcardFlipped
                                  ? styles.flashcardInnerFlipped
                                  : ""
                              }`}
                            >
                              {/* Mặt trước */}
                              <div
                                className={`${styles.flashcardFace} ${styles.flashcardFaceFront}`}
                              >
                                <div className={styles.flashcardFrontMain}>
                                  {currentFlashcard.frontText ||
                                    currentFlashcard.front ||
                                    currentFlashcard.term ||
                                    currentFlashcard.word ||
                                    "Mặt trước"}
                                </div>
                              </div>

                              {/* Mặt sau */}
                              <div
                                className={`${styles.flashcardFace} ${styles.flashcardFaceBack}`}
                              >
                                <div className={styles.flashcardBackMain}>
                                  {currentFlashcard.backText || "Mặt sau"}
                                </div>

                                {currentFlashcard.reading && (
                                  <div className={styles.flashcardBackReading}>
                                    {currentFlashcard.reading}
                                  </div>
                                )}

                                {currentFlashcard.exampleSentence && (
                                  <div className={styles.flashcardBackExample}>
                                    {currentFlashcard.exampleSentence}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        </div>

                        {/* --- CONTROLS --- */}
                        <div className={styles.flashcardControls}>
                          <span className={styles.flashcardCounter}>
                            Thẻ {flashcardIndex + 1} / {flashcards.length}
                          </span>
                          <div className={styles.flashcardNavButtons}>
                            <button
                              type="button"
                              className={styles.secondaryBtn}
                              onClick={goPrevFlashcard}
                              disabled={flashcardIndex <= 1}
                            >
                              Trước
                            </button>
                            <button
                              type="button"
                              className={styles.primaryBtn}
                              onClick={goNextFlashcard}
                              disabled={flashcards.length <= 1}
                            >
                              Sau
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
