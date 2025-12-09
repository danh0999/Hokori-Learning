import React from "react";
import styles from "./CourseCard.module.scss";
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import { FaCertificate } from "react-icons/fa";
import ProgressBar from "../../LearnerDashboard/components/ProgressBar";

/**
 * CourseCard — thẻ khóa học trong trang "Khóa học của tôi"
 *
 * Props:
 *  - course: {
 *      id,
 *      title,
 *      level,
 *      teacher,
 *      lessons,
 *      lastStudy,
 *      progress,
 *      favorite,
 *      completed
 *    }
 *  - onContinue(course): callback khi nhấn "Tiếp tục học"
 *  - onViewCertificate(course): callback khi nhấn "Xem chứng chỉ"
 */
const CourseCard = ({ course, onContinue, onViewCertificate }) => {
  const isCompleted = course.completed === true;

  const handleAction = () => {
    if (isCompleted) {
      onViewCertificate && onViewCertificate(course);
    } else {
      onContinue && onContinue(course);
    }
  };

  return (
    <div className={styles.card}>
      {/* Cover */}
      <div className={styles.cover}>
        <img
          src={
            course.coverUrl ||
            "https://cdn.pixabay.com/photo/2017/01/31/13/14/book-2024684_1280.png"
          }
          alt={course.title}
        />
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Header */}
        <div className={styles.top}>
          <span className={styles.level}>{course.level}</span>
          {course.favorite ? (
            <FaHeart className={styles.filledHeart} />
          ) : (
            <FaRegHeart className={styles.emptyHeart} />
          )}
        </div>

        {/* Title */}
        <h3 className={styles.title}>{course.title}</h3>
        <p className={styles.teacher}>{course.teacher}</p>

        {/* 👉 Banner trạng thái FLAGGED */}
        {course.status === "FLAGGED" && course.statusMessage && (
          <div className={styles.statusBanner}>{course.statusMessage}</div>
        )}

        {/* Tiến độ */}

        <div className={styles.progress}>
          <ProgressBar
            value={course.progress || 0}
            label="Tiến độ"
            size="md"
            showPercent
          />
        </div>

        {/* Meta */}
        <div className={styles.meta}>
          <span>{course.lessons} bài học</span>
          <span>
            {isCompleted
              ? `Hoàn thành: ${course.lastStudy}`
              : `Học gần nhất: ${course.lastStudy}`}
          </span>
        </div>

        {/* Action button */}
        <button
          className={
            isCompleted
              ? styles.certificateBtn
              : styles.actionBtn
          }
          onClick={handleAction}
        >
          {isCompleted ? (
            <>
              <FaCertificate />
              Xem chứng chỉ
            </>
          ) : (
            "Tiếp tục học"
          )}
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
