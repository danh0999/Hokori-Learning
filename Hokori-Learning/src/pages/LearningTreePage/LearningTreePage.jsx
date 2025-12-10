// src/pages/LearningTreePage/LearningTreePage.jsx
import React, { useEffect, useState } from "react";
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

export default function LearningTreePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openChapters, setOpenChapters] = useState(new Set());
  const [openLessons, setOpenLessons] = useState(new Set());

  useEffect(() => {
    fetchTree();
  }, [courseId]);

  const fetchTree = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/learner/courses/${courseId}/learning-tree`);
      setData(res.data);

      if (res.data?.chapters?.length) {
        setOpenChapters(new Set([res.data.chapters[0].chapterId]));
      }
    } catch {
      setError("Không thể tải tiến độ học tập");
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (id) => {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleLesson = (id) => {
    setOpenLessons((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // --- LOGIC ĐIỀU HƯỚNG MỚI ---
  const handleContentClick = (lessonId, content) => {
    if (content.contentFormat === "FLASHCARD_SET") {
      // Sửa lỗi điều hướng: dùng contentId (hoặc id) thay vì flashcardSetId (vì có thể null)
      // Truyền thêm state courseId & lessonId để nút Back hoạt động
      const targetId = content.contentId || content.id;
      navigate(`/learner/flashcards/${targetId}`, {
        state: { 
            courseId: courseId,
            lessonId: lessonId 
        }
      });
      return;
    }
    
    // Điều hướng vào bài học (LessonPlayer)
    navigate(
      `/course/${courseId}/lesson/${lessonId}`, 
      {
        state: { 
            targetContentId: content.contentId,
            type: content.contentFormat
        }
      }
    );
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (error || !data) return <div className={styles.error}>{error}</div>;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* ===== HEADER ===== */}
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
              <span>{data.progressPercent}%</span>
            </div>
          </div>
        </section>

        {/* ===== TREE ===== */}
        <section className={styles.treeCard}>
          <div className={styles.treeHeaderRow}>
            <h2 className={styles.sectionTitle}>Nội dung khóa học</h2>
            <span className={styles.treeOverallPercent}>
              {data.progressPercent}%
            </span>
          </div>

          {data.chapters.map((ch) => (
            <div key={ch.chapterId} className={styles.chapter}>
              {/* CHAPTER HEADER */}
              <button
                type="button"
                className={styles.chapterHeader}
                onClick={() => toggleChapter(ch.chapterId)}
              >
                <span className={styles.arrowIcon}>
                  {openChapters.has(ch.chapterId) ? (
                    <FiChevronDown />
                  ) : (
                    <FiChevronRight />
                  )}
                </span>

                <span className={styles.chapterTitle}>{ch.title}</span>

                <span className={styles.chapterPercent}>
                  {ch.progressPercent}%
                </span>
              </button>

              {/* CHAPTER BODY (ANIMATED) */}
              <AnimatePresence initial={false}>
                {openChapters.has(ch.chapterId) && (
                  <motion.div
                    className={styles.lessonContainer}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {ch.lessons.map((ls) => (
                      <div key={ls.lessonId} className={styles.lessonItem}>
                        {/* LESSON HEADER */}
                        <button
                          type="button"
                          className={styles.lessonHeader}
                          onClick={() => toggleLesson(ls.lessonId)}
                        >
                          <span className={styles.arrowIcon}>
                            {openLessons.has(ls.lessonId) ? (
                              <FiChevronDown />
                            ) : (
                              <FiChevronRight />
                            )}
                          </span>

                          <span className={styles.lessonTitle}>{ls.title}</span>

                          {ls.isCompleted && (
                            <AiOutlineCheck className={styles.lessonDoneIcon} />
                          )}
                        </button>

                        {/* LESSON BODY */}
                        <AnimatePresence initial={false}>
                          {openLessons.has(ls.lessonId) && (
                            <motion.div
                              className={styles.sectionList}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              {ls.sections.map((sec) => (
                                <div
                                  key={sec.sectionId}
                                  className={styles.sectionBlock}
                                >
                                  <p className={styles.sectionName}>
                                    {sec.title}
                                  </p>

                                  <ul className={styles.contentList}>
                                    {sec.contents.map((ct) => (
                                      <li
                                        key={ct.contentId}
                                        className={`${styles.contentItem} ${
                                          ct.isCompleted
                                            ? styles.contentCompleted
                                            : ""
                                        }`}
                                        onClick={() =>
                                          handleContentClick(ls.lessonId, ct)
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
                                        </span>

                                        <span
                                          className={styles.contentMainText}
                                        >
                                          {ct.contentFormat === "ASSET" &&
                                            "Video bài giảng"}
                                          {ct.contentFormat === "RICH_TEXT" &&
                                            "Nội dung bài đọc"}
                                          {ct.contentFormat ===
                                            "FLASHCARD_SET" && "Từ vựng"}
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}