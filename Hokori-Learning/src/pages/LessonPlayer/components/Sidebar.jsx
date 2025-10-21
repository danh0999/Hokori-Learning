import React from "react";
import styles from "./Sidebar.module.scss";

const Sidebar = () => {
  const mockOutline = [
    {
      title: "Chương 1: Ngữ pháp cơ bản",
      lessons: ["Bài 1: Ôn tập Hiragana", "Bài 2: Trợ từ cơ bản"],
    },
    {
      title: "Chương 2: Các dạng động từ",
      lessons: ["Bài 12: Thể て (て-form)", "Bài 13: Thì quá khứ"],
    },
  ];

  return (
    <div className={styles.sidebar}>
      <h3>Mục lục khóa học</h3>
      {mockOutline.map((ch, i) => (
        <div key={i} className={styles.section}>
          <p className={styles.sectionTitle}>{ch.title}</p>
          <div className={styles.lessons}>
            {ch.lessons.map((l, j) => (
              <div
                key={j}
                className={`${styles.lessonItem} ${
                  l.includes("て") ? styles.active : ""
                }`}
              >
                {l}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
