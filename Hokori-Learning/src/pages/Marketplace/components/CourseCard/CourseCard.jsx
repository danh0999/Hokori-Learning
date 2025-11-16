import React from "react";
import styles from "./CourseCard.module.scss";
import { Button } from "../../../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaShoppingCart } from "react-icons/fa";
import { addToCart } from "../../../../redux/features/cartSlice";

const FALLBACK_THUMB = "https://placehold.co/600x400?text=Course+Image";
const FALLBACK_AVATAR =
  "https://thumbs.dreamstime.com/b/teacher-icon-vector-male-person-profile-avatar-book-teaching-school-college-university-education-glyph-113755262.jpg";

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ============================================
  //  BACKEND FIELDS — TÙY API TRẢ VỀ
  // ============================================
  const {
    id,
    title,
    subtitle,
    thumbnailUrl,
    teacherName,
    teacherAvatar,
  } = course;

  // ============================================
  //  UI FALLBACKS
  // ============================================
  const displaySubtitle = subtitle || "Khóa học đang cập nhật nội dung";
  const displayThumbnail = thumbnailUrl || FALLBACK_THUMB;
  const displayTeacher = teacherName || "Giáo viên đang cập nhật";
  const avatar = teacherAvatar || FALLBACK_AVATAR;

  return (
    <div className={styles.card}>
      {/* Thumbnail */}
      <div className={styles.thumb}>
        <img src={displayThumbnail} alt={title} />
      </div>

      <div className={styles.body}>
        {/* Title */}
        <h3 className={styles.title}>{title}</h3>

        {/* Subtitle */}
        <p className={styles.subtitle}>{displaySubtitle}</p>

        {/* Teacher */}
        <div className={styles.teacher}>
          <img src={avatar} alt={displayTeacher} />
          <span className={styles.name}>{displayTeacher}</span>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {/* View Detail */}
          <Button
            content="Thông tin"
            onClick={() => navigate(`/course/${id}`)} //  API MODE — KHÔNG DÙNG setCurrentCourse
            containerClassName={styles.actionItem}
            className={styles.actionButton}
          />

          {/* Add to cart */}
          <Button
            content={
              <>
                <FaShoppingCart style={{ marginRight: 6 }} />
                Thêm vào giỏ
              </>
            }
            onClick={() => dispatch(addToCart(course))}
            containerClassName={styles.actionItem}
            className={`${styles.actionButton} ${styles.cartButton}`}
          />
        </div>
      </div>
    </div>
  );
}