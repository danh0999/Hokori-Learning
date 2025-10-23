import React from "react";
import styles from "./QuestionCard.module.scss";

const QuestionCard = ({
  question,
  index,
  total,
  onNext,
  onPrev,
  selectedAnswer,
  onSelectAnswer,
}) => {
  if (!question) return <p>Đang tải câu hỏi...</p>;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2>Câu {index + 1} / {total}</h2>
        <p className={styles.text}>{question.question}</p>
      </div>

      <div className={styles.options}>
        {question.options.map((opt, i) => (
          <label
            key={i}
            className={`${styles.option} ${
              selectedAnswer === opt ? styles.selected : ""
            }`}
          >
            <input
              type="radio"
              name={`q${question.id}`}
              value={opt}
              checked={selectedAnswer === opt}
              onChange={() => onSelectAnswer(question.id, opt)}
            />
            {opt}
          </label>
        ))}
      </div>

      <div className={styles.actions}>
        <button onClick={onPrev} className={styles.prevBtn}>
          ← Trước
        </button>
        <button onClick={onNext} className={styles.nextBtn}>
          Tiếp →
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
