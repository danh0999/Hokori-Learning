import React from "react";
import styles from "./styles.module.scss";

export default function CourseLevel() {
  const levels = [
    {
      id: "N5",
      title: "Beginner",
      desc: "Basic hiragana, katakana, and simple phrases",
      color: "#22c55e",
    },
    {
      id: "N4",
      title: "Elementary",
      desc: "Basic kanji and everyday conversations",
      color: "#3b82f6",
    },
    {
      id: "N3",
      title: "Intermediate",
      desc: "Complex sentences and reading comprehension",
      color: "#f59e0b",
    },
    {
      id: "N2",
      title: "Upper Intermediate",
      desc: "Advanced grammar and business Japanese",
      color: "#a855f7",
    },
    {
      id: "N1",
      title: "Advanced",
      desc: "Professional proficiency and literature",
      color: "#ef4444",
    },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>JLPT Course Levels</h2>
      <p className={styles.subHeading}>
        Structured learning path from beginner to advanced
      </p>

      <div className={styles.cardWrapper}>
        {levels.map((level) => (
          <button
            key={level.id}
            className={styles.card}
            style={{ backgroundColor: level.color }}
            onClick={() => alert(`Go to ${level.id} course`)} // sau này bạn có thể thay bằng router link
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
