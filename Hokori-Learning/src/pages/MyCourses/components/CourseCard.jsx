import React from "react";
import styles from "./CourseCard.module.scss";
import { FaCertificate } from "react-icons/fa";

const CourseCard = ({ course, onContinue, onViewCertificate }) => {
  const isCompleted = course.completed === true;

  // ❗ KHÔNG dùng ảnh default nữa
  const thumbnail = course.coverUrl || null;

  const handleOpenCourse = () => {
    if (isCompleted) {
      onViewCertificate?.(course);
    } else {
      onContinue?.(course);
    }
  };

  const handleViewCertificate = (e) => {
    e.stopPropagation();
    onViewCertificate?.(course);
  };

  return (
    <div className={styles.card}>
      {/* Thumbnail */}
      <div className={styles.thumbnail}>
        {thumbnail ? (
          <img src={thumbnail} alt={course.title} />
        ) : (
          <div className={styles.noImage}></div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <div className={styles.leftHeader}>
            {course.level && (
              <span className={styles.levelBadge}>{course.level}</span>
            )}
            <h3 className={styles.title} onClick={handleOpenCourse}>
              {course.title}
            </h3>
          </div>
        </div>

        <p className={styles.teacher}>{course.teacher}</p>

        {course.status === "FLAGGED" && course.statusMessage && (
          <div className={styles.statusBanner}>{course.statusMessage}</div>
        )}

        <div className={styles.middleRow}>
          <div className={styles.progressBlock}>
            <div className={styles.progressTop}>
              <span className={styles.progressLabel}>Tiến độ</span>
              <span className={styles.progressPercent}>
                {Math.round(course.progress || 0)}%
              </span>
            </div>
            <div className={styles.progressBarOuter}>
              <div
                className={styles.progressBarInner}
                style={{ width: `${course.progress || 0}%` }}
              />
            </div>
          </div>

          <div className={styles.metaBlock}>
            <span>{course.lessons || 0} bài học</span>
            <span>
              {isCompleted
                ? `Hoàn thành: ${course.lastStudy}`
                : `Học gần nhất: ${course.lastStudy}`}
            </span>
          </div>
        </div>

        <div className={styles.footerRow}>
          {isCompleted && (
            <button
              type="button"
              className={styles.secondaryLink}
              onClick={handleViewCertificate}
            >
              <FaCertificate />
              <span>Xem chi tiết chứng chỉ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
