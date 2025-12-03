import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/Button/Button";
import styles from "./QuickActions.module.scss";

const QuickActions = ({ lessonId, firstQuizId, flashcardContentId }) => {
  const navigate = useNavigate();

  const mockQuizId = firstQuizId || 1;

  const handleQuiz = () => {
    navigate(`quiz/${mockQuizId}`);
  };

  const handleFlashcard = () => {
    if (!flashcardContentId) {
      alert("Bài học này không có flashcard.");
      return;
    }
    navigate(`/learner/flashcards/${flashcardContentId}`);
  };

  const actions = [
    { label: "Tệp đính kèm", action: null },
    { label: "Quiz nhanh", action: handleQuiz },
    { label: "Flashcard", action: handleFlashcard },
    { label: "Ghi chú của tôi", action: null },
  ];

  return (
    <div className={styles.quickGrid}>
      {actions.map((item) => (
        <Button
          key={item.label}
          content={item.label}
          className={styles.card}
          onClick={
            item.action
              ? item.action
              : () => alert(`Tính năng "${item.label}" đang phát triển.`)
          }
        />
      ))}
    </div>
  );
};

export default QuickActions;
