// src/pages/QuizPage/components/QuestionCard.jsx
import React from "react";
import styles from "./QuestionCard.module.scss";

const QuestionCard = ({
  question,
  index,
  total,
  selectedOptionId,
  onSelectAnswer,
}) => {
  if (!question) return null;

  const { content, options = [] } = question;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.index}>Câu {index + 1}/{total}</span>
      </div>

      <p className={styles.questionText}>{content}</p>

      <div className={styles.options}>
        {options.map((opt) => (
          <label
            key={opt.optionId}
            className={`${styles.option} ${
              selectedOptionId === opt.optionId ? styles.selected : ""
            }`}
          >
            <input
              type="radio"
              name={`q-${question.questionId}`}
              checked={selectedOptionId === opt.optionId}
              onChange={() => onSelectAnswer(opt.optionId)}
            />
            <span>{opt.content}</span>
          </label>
        ))}

        {options.length === 0 && (
          <p className={styles.noOptions}>Chưa có đáp án cho câu hỏi này.</p>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;
