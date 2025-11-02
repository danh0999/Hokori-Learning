import React from "react";
import styles from "./SidebarQuestionList.module.scss";

const SidebarQuestionList = ({
  questions,
  currentIndex,
  answersByQuestion,
  totalQuestions,
  onJumpTo,
}) => {
  const answered = Object.keys(answersByQuestion).length;
  const notYet = totalQuestions - answered;

  return (
    <aside className={styles.sidebar}>
      <h3>Danh sách câu hỏi</h3>

      {/*  Vùng chứa có scroll */}
      <div className={styles.scrollContainer}>
        <div className={styles.grid}>
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const hasAnswer = !!answersByQuestion[q.question_id];

            let stateClass = "";
            if (isCurrent) stateClass = styles.current;
            else if (hasAnswer) stateClass = styles.answered;

            return (
              <button
                key={q.question_id}
                className={`${styles.numBtn} ${stateClass}`}
                onClick={() => onJumpTo(idx)}
              >
                {q.order_index}
              </button>
            );
          })}
        </div>
      </div>

      {/* Phần trạng thái */}
      <div className={styles.status}>
        <div>
          <span className={`${styles.dot} ${styles.dotDoing}`}></span>
          <span>Đang làm ({questions[currentIndex]?.order_index})</span>
        </div>
        <div>
          <span className={`${styles.dot} ${styles.dotAnswered}`}></span>
          <span>Đã chọn ({answered})</span>
        </div>
        <div>
          <span className={`${styles.dot} ${styles.dotNotYet}`}></span>
          <span>Chưa làm ({notYet})</span>
        </div>
      </div>
    </aside>
  );
};

export default SidebarQuestionList;
