// src/pages/LessonPlayer/components/LessonActions.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LessonActions.module.scss";

// Nhận thêm prop courseId
const LessonActions = ({ courseId, lessonId, quizId }) => {
  const navigate = useNavigate();

  if (!quizId) return null;

  const handleStartQuiz = () => {
    // Xây dựng đường dẫn khớp hoàn toàn với Route.jsx
    // Route: course/:courseId/lesson/:lessonId/quiz/:quizId
    navigate(`/course/${courseId}/lesson/${lessonId}/quiz/${quizId}`);
  };

  return (
    <div className={styles.actionsContainer}>
      <button className={styles.quizButton} onClick={handleStartQuiz}>
        <span className={styles.icon}>📝</span>
        <span className={styles.text}>Làm bài tập trắc nghiệm</span>
      </button>
    </div>
  );
};

export default LessonActions;