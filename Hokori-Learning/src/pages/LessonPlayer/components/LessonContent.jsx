import React from "react";
import styles from "./LessonContent.module.scss";

const LessonContent = ({ data }) => {
  return (
    <div className={styles.content}>
      <h3 className={styles.heading}>Nội dung bài học</h3>
      {data && data.length > 0 ? (
        data.map((s, i) => (
          <div key={i} className={styles.section}>
            <h4 className={styles.title}>{s.title}</h4>
            <p className={styles.text}>{s.content}</p>
          </div>
        ))
      ) : (
        <p className={styles.placeholder}>Nội dung đang được cập nhật...</p>
      )}
    </div>
  );
};

export default LessonContent;
