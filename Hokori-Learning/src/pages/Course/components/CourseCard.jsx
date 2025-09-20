import React from "react";
import styles from "./courseCard.module.scss";
import { Badge } from "./Badge";
import { FaBook } from "react-icons/fa";
export const CourseCard = ({ title, desc, lessons, badge }) => {
  const { card, cardHeader, cardTitle, cardDesc, cardFooter } = styles;

  return (
    <div className={card}>
      <div className={cardHeader}>
        <h3 className={cardTitle}>{title}</h3>
        {badge && <Badge text={badge} small />}
      </div>
      <p className={cardDesc}>{desc}</p>
      <div className={cardFooter}>
        <FaBook size={16} /> <span className={styles.lessons}> {lessons} bài học</span>
      </div>
    </div>
  );
};
