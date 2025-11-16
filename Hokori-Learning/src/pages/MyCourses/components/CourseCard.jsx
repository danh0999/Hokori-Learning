import React from "react";
import styles from "./CourseCard.module.scss";
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import ProgressBar from "../../LearnerDashboard/components/ProgressBar";

/**
 * CourseCard — thẻ khóa học trong trang "Khóa học của tôi"
 *
 * Props:
 *  - course: { id, title, level, teacher, lessons, lastStudy, progress, favorite, completed }
 *  - onContinue(course): callback khi nhấn nút "Tiếp tục học"
 */
const CourseCard = ({ course, onContinue }) => {
  return (
    <div className={styles.card}>
      {/* Ảnh cover (có thể thay src từ course.coverUrl sau) */}
      <div className={styles.cover}>
        <img
          src={
            course.coverUrl ||
            "https://cdn.pixabay.com/photo/2017/01/31/13/14/book-2024684_1280.png"
          }
          alt={course.title}
        />
      </div>

      {/* Nội dung */}
      <div className={styles.body}>
        {/* Header: Level + Favorite */}
        <div className={styles.top}>
          <span className={styles.level}>{course.level}</span>
          {course.favorite ? (
            <FaHeart className={styles.filledHeart} />
          ) : (
            <FaRegHeart className={styles.emptyHeart} />
          )}
        </div>

        {/* Thông tin chính */}
        <h3 className={styles.title}>{course.title}</h3>
        <p className={styles.teacher}>{course.teacher}</p>

        {/* Tiến độ */}
        <div className={styles.progress}>
          <ProgressBar
            value={course.progress || 0}
            label="Tiến độ"
            size="md"
            showPercent
          />
        </div>

        {/* Meta info */}
        <div className={styles.meta}>
          <span>{course.lessons} bài học</span>
          <span>
            {course.completed
              ? `Hoàn thành: ${course.lastStudy}`
              : `Học gần nhất: ${course.lastStudy}`}
          </span>
        </div>

        {/* Nút hành động */}
        <button
          className={styles.actionBtn}
          onClick={() => onContinue && onContinue(course)}
        >
          {course.completed ? "Xem chứng chỉ" : "Tiếp tục học"}
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
