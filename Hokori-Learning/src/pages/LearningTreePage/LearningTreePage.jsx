import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../configs/axios";
import styles from "./LearningTreePage.module.scss";
import { buildFileUrl } from "../../utils/fileUrl";

// ================================
// LearningTreePage
// Trang tổng quan học tập (Coursera-style)
// ================================

export default function LearningTreePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openChapters, setOpenChapters] = useState(new Set());
  const [openLessons, setOpenLessons] = useState(new Set());

  useEffect(() => {
    fetchLearningTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchLearningTree = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/learner/courses/${courseId}/learning-tree`);
      setData(res.data);

      // auto-expand chapter đầu tiên cho UX tốt
      if (res.data?.chapters?.length) {
        setOpenChapters(new Set([res.data.chapters[0].chapterId]));
      }
    } catch (err) {
      setError("Không thể tải tiến độ học tập");
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chapterId) => {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      next.has(chapterId) ? next.delete(chapterId) : next.add(chapterId);
      return next;
    });
  };

  const toggleLesson = (lessonId) => {
    setOpenLessons((prev) => {
      const next = new Set(prev);
      next.has(lessonId) ? next.delete(lessonId) : next.add(lessonId);
      return next;
    });
  };

  const handleContentClick = (lessonId, content) => {
    if (content.contentFormat === "FLASHCARD_SET") {
      navigate(`/flashcards/${content.flashcardSetId}`);
      return;
    }

    // mặc định: lesson page sẽ tự đọc contentId từ query
    navigate(`/course/${courseId}/lesson/${lessonId}?contentId=${content.contentId}`);
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (error || !data) return <div className={styles.error}>{error}</div>;

  return (
    <main className={styles.page}>
      {/* ===== Course Header ===== */}
      <section className={styles.courseHeader}>
        <img
          src={buildFileUrl(data.coverImagePath) || "/placeholder-course.png"}
          alt={data.courseTitle}
          className={styles.cover}
        />
        <div className={styles.courseInfo}>
          <h1>{data.courseTitle}</h1>
          <p>{data.courseSubtitle}</p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${data.progressPercent}%` }}
            />
          </div>
          <span className={styles.progressText}>
            Hoàn thành {data.progressPercent}%
          </span>
        </div>
      </section>

      {/* ===== Learning Tree ===== */}
      <section className={styles.tree}>
        {data.chapters.map((chapter) => (
          <div key={chapter.chapterId} className={styles.chapter}>
            <div
              className={styles.chapterHeader}
              onClick={() => toggleChapter(chapter.chapterId)}
            >
              <span className={styles.toggle}>
                {openChapters.has(chapter.chapterId) ? "▼" : "▶"}
              </span>
              <h2>{chapter.title}</h2>
              <span className={styles.chapterProgress}>
                {chapter.progressPercent}%
              </span>
            </div>

            {openChapters.has(chapter.chapterId) && (
              <div className={styles.lessons}>
                {chapter.lessons.map((lesson) => (
                  <div key={lesson.lessonId} className={styles.lesson}>
                    <div
                      className={styles.lessonHeader}
                      onClick={() => toggleLesson(lesson.lessonId)}
                    >
                      <span className={styles.toggle}>
                        {openLessons.has(lesson.lessonId) ? "▼" : "▶"}
                      </span>
                      <h3>{lesson.title}</h3>
                      {lesson.isCompleted && (
                        <span className={styles.completed}>✓</span>
                      )}
                    </div>

                    {openLessons.has(lesson.lessonId) && (
                      <div className={styles.sections}>
                        {lesson.sections.map((section) => (
                          <div
                            key={section.sectionId}
                            className={styles.section}
                          >
                            <h4>{section.title}</h4>
                            <ul className={styles.contents}>
                              {section.contents.map((content) => (
                                <li
                                  key={content.contentId}
                                  className={`${styles.content} ${
                                    content.isCompleted
                                      ? styles.done
                                      : ""
                                  }`}
                                  onClick={() =>
                                    handleContentClick(
                                      lesson.lessonId,
                                      content
                                    )
                                  }
                                >
                                  <span className={styles.icon}>
                                    {content.contentFormat === "ASSET" && "▶"}
                                    {content.contentFormat === "RICH_TEXT" && "📄"}
                                    {content.contentFormat === "FLASHCARD_SET" &&
                                      "📚"}
                                  </span>
                                  <span>
                                    Nội dung {content.orderIndex}
                                  </span>
                                  {content.isCompleted && <span>✓</span>}
                                  {!content.isCompleted &&
                                    content.lastPositionSec > 0 && (
                                      <span className={styles.resume}>
                                        Tiếp tục tại {Math.floor(
                                          content.lastPositionSec / 60
                                        )}:
                                        {(content.lastPositionSec % 60)
                                          .toString()
                                          .padStart(2, "0")}
                                      </span>
                                    )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
