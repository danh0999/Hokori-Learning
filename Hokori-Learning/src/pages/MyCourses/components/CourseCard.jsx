import React from "react";
import styles from "./CourseCard.module.scss";
import { FaCertificate } from "react-icons/fa";

const CourseCard = ({ course, onContinue, onViewCertificate }) => {
  const isCompleted = course.completed === true;

  // KHÔNG dùng ảnh default nữa
  const thumbnail = course.coverUrl || null;

  // Click card -> luôn vào học (learn page)
  const handleOpenCourse = () => {
    onContinue?.(course);
  };

  // Click nút chứng chỉ -> vào certificate, không dính onClick card
  const handleViewCertificate = (e) => {
    e.stopPropagation();
    onViewCertificate?.(course);
  };

  return (
    <div className={styles.card}>
      {/* Thumbnail */}
      <div className={styles.thumbnail} onClick={handleOpenCourse}>
        {thumbnail ? (
          <img src={thumbnail} alt={course.title} />
        ) : (
          <div className={styles.noImage}></div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content} onClick={handleOpenCourse}>
        <div className={styles.headerRow}>
          <div className={styles.leftHeader}>
            {course.level && (
              <span className={styles.levelBadge}>{course.level}</span>
            )}
            <h3 className={styles.title}>{course.title}</h3>
            {course.teacherName && (
              <div className={styles.teacherName}>
                Giảng viên: {course.teacherName}
              </div>
            )}
          </div>
        </div>

        {course.courseStatus === "FLAGGED" && (
          <div className={styles.statusBanner}>
            {course.courseStatusMessage ||
              "Khóa học đang được cập nhật nội dung do kiểm duyệt."}
          </div>
        )}

        <div className={styles.middleRow}>
          {course.isTrialOnly ? (
            <div className={styles.trialOnlyNote}>
              Khóa học hiện chỉ có nội dung học thử.
            </div>
          ) : (
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
          )}

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
