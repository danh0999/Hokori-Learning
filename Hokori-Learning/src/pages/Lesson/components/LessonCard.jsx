import React from "react";
import styles from "./lessonCard.module.scss";
import { Badge } from "./Badge";

export const LessonCard = ({ title, desc, lessons, badge }) => {
  const { card, cardHeader, cardTitle, cardDesc, cardFooter } = styles;

  return (
    <div className={card}>
      <div className={cardHeader}>
        <h3 className={cardTitle}>{title}</h3>
        {badge && <Badge text={badge} small />}
      </div>
      <p className={cardDesc}>{desc}</p>
      <div className={cardFooter}>
         <span>{lessons} bài học</span>
      </div>
    </div>
  );
};
