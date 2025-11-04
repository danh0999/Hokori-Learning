import React from "react";
import styles from "./SidebarQuestionList.module.scss";

const SidebarQuestionList = ({
  questions = [],
  currentIndex = 0,
  answersByQuestion = {},
  totalQuestions,
  onJumpTo,
}) => {
  const total = totalQuestions || questions.length || 0;
  const answeredIds = Object.keys(answersByQuestion).map(String); // ép string hết
  const answered = answeredIds.length;
  const notYet = Math.max(total - answered, 0); // tránh NaN

  return (
    <aside className={styles.sidebar}>
      <h3>Danh sách câu hỏi</h3>

      {/* Vùng chứa có scroll */}
      <div className={styles.scrollContainer}>
        <div className={styles.grid}>
          {questions.map((q, idx) => {
            const qid = String(q.question_id); // convert luôn để đồng bộ
            const isCurrent = idx === currentIndex;
            const hasAnswer = answeredIds.includes(qid); // check chuẩn bất kể kiểu dữ liệu

            let stateClass = "";
            if (isCurrent) stateClass = styles.current;
            else if (hasAnswer) stateClass = styles.answered;

            return (
              <button
                key={qid}
                className={`${styles.numBtn} ${stateClass}`}
                onClick={() => onJumpTo && onJumpTo(idx)}
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
          <span>Đang làm ({questions[currentIndex]?.order_index || 0})</span>
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
