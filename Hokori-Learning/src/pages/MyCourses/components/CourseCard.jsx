import React from "react";
import styles from "./CourseCard.module.scss";
import { FaHeart, FaRegHeart } from "react-icons/fa6";

const CourseCard = ({ course }) => {
  return (
    <div className={styles.card}>
      <div className={styles.cover}>Course Cover Image</div>

      <div className={styles.body}>
        <div className={styles.top}>
          <span className={styles.level}>{course.level}</span>
          {course.favorite ? (
            <FaHeart className={styles.filledHeart} />
          ) : (
            <FaRegHeart className={styles.emptyHeart} />
          )}
        </div>

        <h3>{course.title}</h3>
        <p>{course.teacher}</p>

        <div className={styles.progress}>
          <div className={styles.info}>
            <span>Tiến độ</span>
            <span>{course.progress}%</span>
          </div>
          <div className={styles.bar}>
            <div
              className={styles.fill}
              style={{ width: `${course.progress}%` }}
            ></div>
          </div>
        </div>

        <div className={styles.meta}>
          <span>{course.lessons} bài học</span>
          <span>{course.completed ? `Hoàn thành: ${course.lastStudy}` : `Học gần nhất: ${course.lastStudy}`}</span>
        </div>

        <button>
          {course.completed ? "Xem chứng chỉ" : "Tiếp tục học"}
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
