import React from "react";
import styles from "./CourseCard.module.scss";
import { Button } from "../../../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../../../redux/features/cartSlice";
import { FaShoppingCart } from "react-icons/fa";

const FALLBACK_THUMB = "https://placehold.co/600x400?text=Course+Image";
const FALLBACK_AVATAR =
  "https://thumbs.dreamstime.com/b/teacher-icon-vector-male-person-profile-avatar-book-teaching-school-college-university-education-glyph-113755262.jpg";

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ============================================
  //  CHUẨN FIELD TRẢ VỀ TỪ BACKEND
  // ============================================
  const { id, title, subtitle, thumbnailUrl, teacherName, teacherAvatar } =
    course;

  // ============================================
  //  UI FALLBACKS
  // ============================================
  const displayThumbnail = thumbnailUrl || FALLBACK_THUMB;
  const displaySubtitle = subtitle || "Khóa học đang cập nhật nội dung";
  const displayTeacher = teacherName || "Giáo viên đang cập nhật";
  const displayAvatar = teacherAvatar || FALLBACK_AVATAR;

  // ============================================
  //  HANDLERS
  // ============================================
  const handleNavigate = () => {
    navigate(`/course/${id}`); // Chuyển đúng CourseDetail
  };

  const handleAddToCart = () => {
    dispatch(addToCart(course));
  };

  return (
    <div className={styles.card}>
      {/* Thumbnail */}
      <div className={styles.thumb} onClick={handleNavigate}>
        <img src={displayThumbnail} alt={title} />
      </div>

      <div className={styles.body}>
        {/* Title */}
        <h3 className={styles.title} onClick={handleNavigate}>
          {title}
        </h3>

        {/* Subtitle */}
        <p className={styles.subtitle}>{displaySubtitle}</p>

        {/* Teacher */}
        <div className={styles.teacher}>
          <img src={displayAvatar} alt={displayTeacher} />
          <span className={styles.name}>{displayTeacher}</span>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            content="Thông tin"
            onClick={handleNavigate}
            containerClassName={styles.actionItem}
            className={styles.actionButton}
          />

          <Button
            content={
              <>
                <FaShoppingCart style={{ marginRight: 6 }} />
                Thêm vào giỏ
              </>
            }
            onClick={handleAddToCart}
            containerClassName={styles.actionItem}
            className={`${styles.actionButton} ${styles.cartButton}`}
          />
        </div>
      </div>
    </div>
  );
}
