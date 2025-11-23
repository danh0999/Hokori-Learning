import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Sidebar.module.scss";

const Sidebar = ({ lessons = [] }) => {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();

  const handleSelect = (id) => {
    navigate(`/course/${courseId}/lesson/${id}`);
  };

  return (
    <div className={styles.sidebar}>
      <h3 className={styles.heading}>Mục lục khóa học</h3>

      {lessons.length === 0 && (
        <p className={styles.placeholder}>Đang tải bài học...</p>
      )}

      {lessons.map((lesson) => (
        <div
          key={lesson.lessonId}
          className={`${styles.lessonItem} ${
            String(lesson.lessonId) === String(lessonId) ? styles.active : ""
          }`}
          onClick={() => handleSelect(lesson.lessonId)}
        >
          <span className={styles.lessonTitle}>{lesson.title}</span>

          {lesson.isCompleted && (
            <span className={styles.completed}>✔</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
