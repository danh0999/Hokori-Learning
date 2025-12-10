// src/pages/LessonPlayer/components/LessonActions.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LessonActions.module.scss";

const LessonActions = ({ quizId, lessonId }) => {
  const navigate = useNavigate();

  // Nếu không có Quiz thì ẩn luôn component này (không render gì cả)
  if (!quizId) return null;

  const handleStartQuiz = () => {
    // Điều hướng đến trang thông tin Quiz
    navigate(`/learner/lessons/${lessonId}/quiz/info`); 
  };

  return (
    <div className={styles.actionsContainer}>
      {/* Chỉ hiển thị duy nhất nút Quiz */}
      <button className={styles.quizButton} onClick={handleStartQuiz}>
        <span className={styles.icon}>📝</span>
        <span className={styles.text}>Làm bài tập trắc nghiệm</span>
      </button>
    </div>
  );
};

export default LessonActions;