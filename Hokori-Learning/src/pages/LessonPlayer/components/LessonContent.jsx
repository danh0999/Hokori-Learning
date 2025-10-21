import React from "react";
import styles from "./LessonContent.module.scss";

const LessonContent = ({ data }) => {
  return (
    <div className={styles.content}>
      <h2>Nội dung bài học</h2>

      {data ? (
        data.map((s, i) => (
          <div key={i} className={styles.block}>
            <h3>{s.title}</h3>
            <div className={styles.examples}>
              {s.examples.map((ex, j) => (
                <div key={j} className={styles.example}>
                  <p className={styles.jp}>{ex.jp}</p>
                  <p className={styles.vi}>{ex.vi}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className={styles.placeholder}>Nội dung bài học sẽ hiển thị tại đây...</p>
      )}
    </div>
  );
};

export default LessonContent;
