// src/pages/LessonPlayer/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Sidebar.module.scss";

const Sidebar = ({ courseTree, isLoading, currentLessonId, courseId }) => {
  const navigate = useNavigate();
  
  const [expandedChapters, setExpandedChapters] = useState({});
  const [expandedLessons, setExpandedLessons] = useState({});

  useEffect(() => {
    if (courseTree?.chapters) {
      const newExpandedChap = {};
      const newExpandedLess = {};
      
      courseTree.chapters.forEach(chap => {
        const hasCurrentLesson = chap.lessons.some(l => l.lessonId === currentLessonId);
        if (hasCurrentLesson) {
             newExpandedChap[chap.chapterId] = true;
             newExpandedLess[currentLessonId] = true;
        }
      });
      setExpandedChapters(prev => ({ ...prev, ...newExpandedChap }));
      setExpandedLessons(prev => ({ ...prev, ...newExpandedLess }));
    }
  }, [courseTree, currentLessonId]);

  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const toggleLesson = (e, lessonId) => {
    e.stopPropagation(); 
    setExpandedLessons(prev => ({ ...prev, [lessonId]: !prev[lessonId] }));
  };

  const handleLessonSelect = (lessonId) => {
    // Quay về chế độ xem mặc định của Lesson (xóa state targetContentId)
    navigate(`/course/${courseId}/lesson/${lessonId}`, { state: {} });
    setExpandedLessons(prev => ({ ...prev, [lessonId]: true }));
  };

  // --- LOGIC ĐIỀU HƯỚNG CONTENT ---
  const handleContentSelect = (e, lessonId, content) => {
    e.stopPropagation(); 

    if (content.contentFormat === 'FLASHCARD_SET') {
        // ✅ CẬP NHẬT: Truyền courseId và lessonId qua state để FlashcardPage dùng nút Back
        navigate(`/learner/flashcards/${content.contentId}`, {
            state: { 
                courseId: courseId, 
                lessonId: lessonId 
            }
        });
    } else {
        // Video hoặc Text -> Gửi state để LessonPlayer hiển thị riêng content đó
        navigate(`/course/${courseId}/lesson/${lessonId}`, {
             state: { 
               targetContentId: content.contentId, 
               type: content.contentFormat 
             }
        });
    }
  };

  if (isLoading) return <div className={styles.loading}>Đang tải mục lục...</div>;
  if (!courseTree) return null;

  return (
    <div className={styles.sidebar}>
      <h3 className={styles.heading}>Nội dung khóa học</h3>
      
      <div className={styles.treeContainer}>
        {courseTree.chapters.map((chapter) => (
          <div key={chapter.chapterId} className={styles.chapterGroup}>
            <div 
              className={styles.chapterHeader} 
              onClick={() => toggleChapter(chapter.chapterId)}
            >
              <span className={styles.arrow}>
                {expandedChapters[chapter.chapterId] ? "▼" : "▶"}
              </span>
              <span className={styles.chapterTitle}>{chapter.title}</span>
            </div>

            {expandedChapters[chapter.chapterId] && (
              <div className={styles.chapterContent}>
                {chapter.lessons.map((lesson) => {
                  const isActive = Number(lesson.lessonId) === Number(currentLessonId);
                  const isExpanded = expandedLessons[lesson.lessonId];

                  return (
                    <div key={lesson.lessonId} className={styles.lessonGroup}>
                      <div 
                        className={`${styles.lessonHeader} ${isActive ? styles.active : ""}`}
                        onClick={() => handleLessonSelect(lesson.lessonId)}
                      >
                         <div className={styles.lessonInfo}>
                            <span 
                                className={styles.lessonArrow}
                                onClick={(e) => toggleLesson(e, lesson.lessonId)}
                            >
                                {isExpanded ? "▼" : "▶"}
                            </span>
                            <span className={styles.lessonTitle}>{lesson.title}</span>
                         </div>
                         {lesson.isCompleted && <span className={styles.check}>✔</span>}
                      </div>

                      {isExpanded && (
                         <div className={styles.sectionList}>
                            {lesson.sections?.map(section => (
                                <div key={section.sectionId} className={styles.sectionItem}>
                                    <div className={styles.sectionTitle}>{section.title}</div>
                                    <div className={styles.contentList}>
                                        {section.contents?.map(content => (
                                            <div 
                                                key={content.contentId} 
                                                className={styles.contentItem}
                                                onClick={(e) => handleContentSelect(e, lesson.lessonId, content)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <span className={styles.contentIcon}>
                                                    {content.contentFormat === 'ASSET' ? '📺' : 
                                                     content.contentFormat === 'FLASHCARD_SET' ? '🎴' : '📄'}
                                                </span>
                                                <span className={styles.contentText}>
                                                    {content.title || (content.contentFormat === 'ASSET' ? 'Video bài giảng' : 
                                                     content.contentFormat === 'FLASHCARD_SET' ? 'Flashcard từ vựng' : 'Tài liệu đọc')}
                                                </span>
                                                {content.isCompleted && <span className={styles.contentCheck}>✔</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;