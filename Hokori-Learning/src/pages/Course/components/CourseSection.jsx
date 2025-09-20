import React from "react";
import styles from "./courseSection.module.scss";
import {CourseCard} from "./CourseCard";
import { Badge } from "./Badge";

export const CourseSection = ({ level, label }) => {
  const { section, header, sectionTitle, cards } = styles;

  // mock data
  const items = [
    { title: "500 Từ vựng", desc: "Học từ vựng cơ bản nhất", lessons: 25, badge: "Mới nhất" },
    { title: "Ngữ pháp", desc: "Cấu trúc ngữ pháp cơ bản", lessons: 18 },
    { title: "Kanji", desc: "80 chữ Kanji cơ bản", lessons: 12 }
  ];

  return (
    <section className={section}>
      <div className={header}>
        <h2 className={sectionTitle}>Kiến thức {level}</h2>
        <Badge text={label} />
      </div>
      <div className={cards}>
        {items.map((item, idx) => (
          <CourseCard key={idx} {...item} />
        ))}
      </div>
    </section>
  );
};
