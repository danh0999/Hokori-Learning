import React from "react";
import styles from "./styles.module.scss";

export default function CourseLevel() {
  const levels = [
    { id: "N5", title: "Sơ cấp", color: "#22c55e" },
    { id: "N4", title: "Căn bản", color: "#3b82f6" },
    { id: "N3", title: "Trung cấp", color: "#f59e0b" },
    { id: "N2", title: "Trung cao cấp", color: "#a855f7" },
    { id: "N1", title: "Cao cấp", color: "#ef4444" },
  ];

  return (
    <section className={styles.container}>
      <h2 className={styles.heading}>Lộ trình JLPT – Từng bước chinh phục tiếng Nhật</h2>
      <p className={styles.subHeading}>
        Bắt đầu từ nền tảng N5 và tiến lên N1 chuyên nghiệp
      </p>

      <div className={styles.timeline}>
        {levels.map((level, index) => (
          <div key={level.id} className={styles.step}>
            <div
              className={styles.circle}
              style={{ backgroundColor: level.color }}
            >
              {level.id}
            </div>
            {index < levels.length - 1 && (
              <div className={styles.line}>
                <div className={styles.progress}></div>
              </div>
            )}
            <h4 className={styles.title}>{level.title}</h4>
          </div>
        ))}
      </div>
    </section>
  );
}
