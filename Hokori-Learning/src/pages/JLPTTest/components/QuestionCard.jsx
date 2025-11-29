// src/pages/JLPTTest/components/QuestionCard.jsx
import React from "react";
import styles from "./QuestionCard.module.scss";

const QuestionCard = ({
  question,
  selectedOptionId,
  onSelectOption,
  onPrev,
  onNext,
  lastSavedAt,
}) => {
  return (
    <div className={styles.card}>
      {/* HEADER */}
      <div className={styles.header}>
        <h2 className={styles.title}>Câu {question.order_index}</h2>
        <span>
          <i className="fa-regular fa-clock" /> {lastSavedAt}
        </span>
      </div>

      {/* AUDIO (nếu có) */}
      {question.audio && (
        <audio className={styles.audio} controls>
          <source src={question.audio} type="audio/mpeg" />
          Trình duyệt không hỗ trợ audio.
        </audio>
      )}

      {/* IMAGE (nếu có) */}
      {question.image && (
        <div className={styles.imageWrapper}>
          <img
            className={styles.image}
            src={question.image}
            alt="Hình minh họa câu hỏi"
          />
        </div>
      )}

      {/* NỘI DUNG */}
      <p className={styles.content}>{question.content}</p>

      {/* OPTIONS */}
      <div className={styles.options}>
        {question.options.map((opt) => {
          const checked = selectedOptionId === opt.option_id;

          return (
            <label
              key={opt.option_id}
              className={`${styles.option} ${checked ? styles.active : ""}`}
            >
              <input
                type="radio"
                name={`q-${question.question_id}`}
                checked={checked}
                onChange={() =>
                  onSelectOption(question.question_id, opt.option_id)
                }
              />

              <div>
                <span className={styles.label}>{opt.label}.</span>
                <span>{opt.text}</span>
              </div>
            </label>
          );
        })}
      </div>

      {/* NAVIGATION */}
      <div className={styles.nav}>
        <button onClick={onPrev}>
          <i className="fa-solid fa-chevron-left" /> Câu trước
        </button>
        <button onClick={onNext}>
          Câu tiếp theo <i className="fa-solid fa-chevron-right" />
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
