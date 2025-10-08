import React from "react";
import styles from "./CourseCard.module.scss";
import { Button } from "../../../../components/Button/Button";

const FALLBACK_IMAGE = "https://via.placeholder.com/48x48";

export default function CourseCard({ course }) {
  const {
    title,
    level,
    price,
    rating,
    ratingCount,
    students,
    teacher,
    teacherName,
    teacherAvatar,
    tags = []
  } = course;

  const displayTeacher = teacherName || teacher || "Dang cap nhat";
  const avatar = teacherAvatar || FALLBACK_IMAGE;
  const displayRatingCount = ratingCount ?? 0;

  return (
    <div className={styles.card}>
      <div className={styles.thumb}>
        <span>Course Thumbnail</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.teacher}>
          <img src={avatar} alt={displayTeacher} />
          <span className={styles.name}>{displayTeacher}</span>
        </div>
        <div className={styles.meta}>
          <span className={styles.badge}>{level}</span>
          <span className={styles.price}>{price.toLocaleString("vi-VN")} d</span>
        </div>
        <div className={styles.stats}>
          <span>Tu {rating}</span>
          <span className={styles.muted}>({displayRatingCount})</span>
          {students && <span className={styles.muted}>{students} hoc vien</span>}
        </div>
        {tags.length > 0 && (
          <div className={styles.chips}>
            {tags.map((chip) => (
              <span key={chip} className={styles.chip}>
                {chip}
              </span>
            ))}
          </div>
        )}
        <div className={styles.actions}>
          <Button
            content="Xem chi tiet"
            onClick={() => {}}
            containerClassName={styles.actionItem}
            className={styles.actionButton}
          />
          <Button
            content="Dang ky"
            onClick={() => {}}
            containerClassName={styles.actionItem}
            className={styles.actionButton}
          />
        </div>
      </div>
    </div>
  );
}
