import React from "react";
import styles from "./RecommendedCourses.module.scss";

const RecommendedCourses = () => {
  const suggestions = [
    { title: "Ngữ Pháp N3 Nâng Cao", teacher: "Sensei Watanabe", price: 549000, old: 799000 },
    { title: "Listening N2 Intensive", teacher: "Sensei Nakamura", price: 649000, old: 899000 },
    { title: "Business Japanese", teacher: "Sensei Kimura", price: 749000 },
    { title: "Văn Hóa Nhật Bản", teacher: "Sensei Hayashi", price: 299000, old: 499000 },
  ];

  return (
    <section className={styles.section}>
      <h2>Có thể bạn sẽ thích</h2>
      <div className={styles.grid}>
        {suggestions.map((c, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.thumbnail}>Course Image</div>
            <div className={styles.info}>
              <h3>{c.title}</h3>
              <p>{c.teacher}</p>
              <div className={styles.price}>
                <span>₫{c.price.toLocaleString()}</span>
                {c.old && <span className={styles.old}>₫{c.old.toLocaleString()}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendedCourses;
