import React from "react";
import styles from "./styles.module.scss";

export default function CourseLevel() {
  const levels = [
    {
      id: "N5",
      title: "Sơ cấp",
      desc: "Học bảng chữ Hiragana, Katakana và các câu giao tiếp đơn giản",
      color: "#22c55e",
    },
    {
      id: "N4",
      title: "Căn bản",
      desc: "Học Kanji cơ bản và hội thoại thường ngày",
      color: "#3b82f6",
    },
    {
      id: "N3",
      title: "Trung cấp",
      desc: "Câu phức và kỹ năng đọc hiểu ở mức trung cấp",
      color: "#f59e0b",
    },
    {
      id: "N2",
      title: "Trung cao cấp",
      desc: "Ngữ pháp nâng cao và tiếng Nhật trong môi trường công việc",
      color: "#a855f7",
    },
    {
      id: "N1",
      title: "Cao cấp",
      desc: "Trình độ chuyên nghiệp, đọc hiểu văn học và tài liệu chuyên sâu",
      color: "#ef4444",
    },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Các cấp độ JLPT</h2>
      <p className={styles.subHeading}>
        Lộ trình học tập từ cơ bản đến nâng cao
      </p>

      <div className={styles.cardWrapper}>
        {levels.map((level) => (
          <button
            key={level.id}
            className={styles.card}
            style={{ backgroundColor: level.color }}
            onClick={() => alert(`Chuyển đến khóa ${level.id}`)} // sau này thay bằng router link
          >
            <h3 className={styles.level}>{level.id}</h3>
            <h4 className={styles.title}>{level.title}</h4>
            <p className={styles.desc}>{level.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
