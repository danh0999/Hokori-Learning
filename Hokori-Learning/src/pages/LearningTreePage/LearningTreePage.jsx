// src/pages/LearningTreePage/LearningTreePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../configs/axios";
import styles from "./LearningTreePage.module.scss";
import { buildFileUrl } from "../../utils/fileUrl";

import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { IoDocumentTextOutline } from "react-icons/io5";
import { MdOndemandVideo } from "react-icons/md";
import { GiCardPick } from "react-icons/gi";
import { AiOutlineCheck } from "react-icons/ai";
import { AnimatePresence, motion } from "framer-motion";

const slugify = (str = "") =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export default function LearningTreePage() {
  // /learn/:courseId/:slug/home/chapter/:chapterIndex
  const { courseId, chapterIndex } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // collapse lesson trong panel bên phải
  const [openLessons, setOpenLessons] = useState(new Set());

  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/learner/courses/${courseId}/learning-tree`);
        setData(res.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Không thể tải tiến độ học tập");
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, [courseId]);

  // khi đổi chapterIndex trên URL → reset lesson đang mở
  useEffect(() => {
    setOpenLessons(new Set());
  }, [chapterIndex]);

  const numericChapterIndex = useMemo(
    () => Number(chapterIndex),
    [chapterIndex]
  );

  const chapters = data?.chapters ?? [];

  // Chapter trial orderIndex = 0 → bỏ khi chọn default
  const nonTrialChapters = chapters.filter((ch) => ch.orderIndex > 0);
  // ===== TRIAL CHAPTER GUARD =====
  const trialChapter = useMemo(
    () => chapters.find((ch) => Number(ch.orderIndex) === 0),
    [chapters]
  );

  // Nếu course chỉ có trial chapter => đá thẳng sang trial page
  useEffect(() => {
    if (!data) return;

    if (nonTrialChapters.length === 0 && trialChapter?.chapterId) {
      navigate(`/course/${courseId}/trial-lesson/${trialChapter.chapterId}`, {
        replace: true,
      });
    }
  }, [
    data,
    nonTrialChapters.length,
    trialChapter?.chapterId,
    navigate,
    courseId,
  ]);

  const activeChapter = useMemo(() => {
    if (!chapters.length) return null;

    if (!Number.isNaN(numericChapterIndex)) {
      const found = nonTrialChapters.find(
        (ch) => ch.orderIndex === numericChapterIndex
      );
      if (found) return found;
    }

    // nếu param không hợp lệ → lấy chapter đầu tiên KHÔNG phải trial
    if (nonTrialChapters.length > 0) return nonTrialChapters[0];

    // fallback: chapter[0]
    return chapters[0];
  }, [chapters, numericChapterIndex, nonTrialChapters]);

  const courseSlug = useMemo(
    () => (data ? slugify(data.courseTitle) : ""),
    [data]
  );

  useEffect(() => {
    if (!data) return;
    if (numericChapterIndex === 0 && nonTrialChapters.length > 0) {
      navigate(
        `/learn/${courseId}/${courseSlug}/home/chapter/${nonTrialChapters[0].orderIndex}`,
        { replace: true }
      );
    }
  }, [
    data,
    numericChapterIndex,
    nonTrialChapters,
    navigate,
    courseId,
    courseSlug,
  ]);

  const handleModuleClick = (chapter) => {
    if (!data || !courseSlug) return;
    if (!chapter || Number(chapter.orderIndex) <= 0) return; // chặn trial
    navigate(
      `/learn/${courseId}/${courseSlug}/home/chapter/${chapter.orderIndex}`
    );
  };

  const toggleLesson = (id) => {
    setOpenLessons((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Điều hướng khi bấm vào content → qua trang Player hoặc Quiz
  const handleContentClick = (
    lessonId,
    content,
    chapterOrderIndex,
    sectionId
  ) => {
    if (!courseSlug) return;

    // Nếu là QUIZ content, navigate đến quiz page
    if (content.contentFormat === "QUIZ" && sectionId) {
      // Navigate đến quiz overview trong LessonPlayerPage
      navigate(
        `/learn/${courseId}/${courseSlug}/lesson/${lessonId}/content/0`,
        {
          state: {
            chapterOrderIndex,
            openQuiz: true,
            quizSectionId: sectionId,
          },
        }
      );
      return;
    }

    // Content thường: navigate đến content page
    navigate(
      `/learn/${courseId}/${courseSlug}/lesson/${lessonId}/content/${content.contentId}`,
      {
        state: {
          chapterOrderIndex,
          contentFormat: content.contentFormat,
        },
      }
    );
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (error || !data) return <div className={styles.error}>{error}</div>;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* ===== HEADER GIỮ PROGRESS ===== */}
        <section className={styles.header}>
          <img
            className={styles.cover}
            src={buildFileUrl(data.coverImagePath)}
            alt="Course Cover"
          />

          <div className={styles.headerInfo}>
            <h1>{data.courseTitle}</h1>
            <p>{data.courseSubtitle}</p>

            <div className={styles.progressWrapper}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${data.progressPercent}%` }}
                />
              </div>
              <span>{data.progressPercent}% hoàn thành</span>
            </div>
          </div>
        </section>

        {/* ===== MAIN 2 CỘT NHƯ COURSERA ===== */}
        <section className={styles.mainLayout}>
          {/* === CỘT TRÁI: MODULE (CHAPTER LIST) === */}
          <aside className={styles.moduleSidebar}>
            <h2 className={styles.sidebarTitle}>Nội dung khóa học</h2>

            <div className={styles.moduleList}>
              {nonTrialChapters.map((ch) => {
                const isActive =
                  activeChapter && ch.chapterId === activeChapter.chapterId;
                const isTrial = ch.orderIndex === 0;

                return (
                  <button
                    key={ch.chapterId}
                    type="button"
                    className={`${styles.moduleItem} ${
                      isActive ? styles.moduleItemActive : ""
                    } ${isTrial ? styles.moduleItemTrial : ""}`}
                    onClick={() => handleModuleClick(ch)}
                  >
                    <span className={styles.moduleLeftBar} />
                    <div className={styles.moduleContent}>
                      <div className={styles.moduleTopRow}>
                        <span className={styles.moduleName}>{ch.title}</span>
                        <span className={styles.modulePercent}>
                          {ch.progressPercent}%
                        </span>
                      </div>
                      <div className={styles.moduleStats}>
                        <span>
                          {ch.lessons?.length || 0} bài học •{" "}
                          {ch.progressPercent}% hoàn thành
                        </span>
                      </div>
                    </div>
                    {ch.progressPercent >= 100 && (
                      <AiOutlineCheck className={styles.moduleDoneIcon} />
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* === CỘT PHẢI: PANEL LESSON CỦA CHAPTER ĐANG CHỌN === */}
          <section className={styles.chapterPanel}>
            {activeChapter ? (
              <>
                <div className={styles.chapterHeaderRow}>
                  <div>
                    <h2 className={styles.chapterTitle}>
                      {activeChapter.title}
                    </h2>
                    {activeChapter.summary && (
                      <p className={styles.chapterSummary}>
                        {activeChapter.summary}
                      </p>
                    )}
                  </div>

                  <div className={styles.chapterProgressBadge}>
                    {activeChapter.progressPercent}% hoàn thành
                  </div>
                </div>

                <div className={styles.lessonList}>
                  {activeChapter.lessons?.map((ls) => (
                    <div key={ls.lessonId} className={styles.lessonCard}>
                      {/* LESSON HEADER */}
                      <button
                        type="button"
                        className={styles.lessonHeader}
                        onClick={() => toggleLesson(ls.lessonId)}
                      >
                        <div className={styles.lessonTitleBlock}>
                          <span className={styles.lessonArrow}>
                            {openLessons.has(ls.lessonId) ? (
                              <FiChevronDown />
                            ) : (
                              <FiChevronRight />
                            )}
                          </span>
                          <span className={styles.lessonTitleText}>
                            {ls.title}
                          </span>
                        </div>

                        <div className={styles.lessonMeta}>
                          {ls.totalDurationSec > 0 && (
                            <span>
                              {Math.round(ls.totalDurationSec / 60)} phút nội
                              dung
                            </span>
                          )}
                          {ls.sections?.some(
                            (s) => s.studyType === "QUIZ" && s.quizId
                          ) && <span>Bài quiz kèm theo</span>}
                        </div>

                        {ls.isCompleted && (
                          <AiOutlineCheck className={styles.lessonDoneIcon} />
                        )}
                      </button>

                      {/* LESSON BODY: SECTION + CONTENT */}
                      <AnimatePresence initial={false}>
                        {openLessons.has(ls.lessonId) && (
                          <motion.div
                            className={styles.sectionList}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {ls.sections?.map((sec) => (
                              <div
                                key={sec.sectionId}
                                className={styles.sectionBlock}
                              >
                                <p className={styles.sectionName}>
                                  {sec.title}
                                </p>

                                <ul className={styles.contentList}>
                                  {sec.contents?.map((ct) => (
                                    <li
                                      key={ct.contentId}
                                      className={`${styles.contentItem} ${
                                        ct.isCompleted
                                          ? styles.contentCompleted
                                          : ""
                                      }`}
                                      onClick={() =>
                                        handleContentClick(
                                          ls.lessonId,
                                          ct,
                                          activeChapter.orderIndex,
                                          sec.sectionId
                                        )
                                      }
                                    >
                                      <span
                                        className={styles.contentIconWrapper}
                                      >
                                        {ct.contentFormat === "ASSET" && (
                                          <MdOndemandVideo />
                                        )}
                                        {ct.contentFormat === "RICH_TEXT" && (
                                          <IoDocumentTextOutline />
                                        )}
                                        {ct.contentFormat ===
                                          "FLASHCARD_SET" && <GiCardPick />}
                                        {ct.contentFormat === "QUIZ" && (
                                          <GiCardPick />
                                        )}
                                      </span>

                                      <span className={styles.contentMainText}>
                                        {ct.contentFormat === "ASSET" &&
                                          "Video bài giảng"}
                                        {ct.contentFormat === "RICH_TEXT" &&
                                          "Nội dung bài đọc"}
                                        {ct.contentFormat === "FLASHCARD_SET" &&
                                          "Từ vựng"}
                                        {ct.contentFormat === "QUIZ" &&
                                          "Bài quiz"}
                                      </span>

                                      {ct.isCompleted && (
                                        <AiOutlineCheck
                                          className={styles.contentDoneIcon}
                                        />
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.placeholder}>
                <h2>Bắt đầu học</h2>
                <p>Khóa học này chưa có chương nào.</p>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
