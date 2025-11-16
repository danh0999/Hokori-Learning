import React from "react";
import styles from "./CourseCard.module.scss";
import { Button } from "../../../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../../../redux/features/cartSlice"; //import addItem
import { FaShoppingCart } from "react-icons/fa";
import { addToCart } from "../../../../redux/features/cartSlice";
import { setCurrentCourse } from "../../../../redux/features/courseSlice";

const FALLBACK_THUMB = "https://placehold.co/600x400?text=Course+Image";
const FALLBACK_AVATAR =
  "https://thumbs.dreamstime.com/b/teacher-icon-vector-male-person-profile-avatar-book-teaching-school-college-university-education-glyph-113755262.jpg";

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Backend fields
  const { id, title, slug, subtitle } = course;

  // UI fallback vì backend chưa hỗ trợ đầy đủ meta
  const displaySubtitle = subtitle || "Khóa học đang cập nhật nội dung";
  const displayTeacher = "Giáo viên đang cập nhật";
  const thumbnailUrl = FALLBACK_THUMB;

  return (
    <div className={styles.card}>
      {/* Thumbnail */}
      <div className={styles.thumb}>
        <img src={thumbnailUrl} alt={title} />
      </div>

      <div className={styles.body}>
        {/* Title */}
        <h3 className={styles.title}>{title}</h3>

        {/* Subtitle */}
        <p className={styles.subtitle}>{displaySubtitle}</p>

        {/* Teacher (fallback) */}
        <div className={styles.teacher}>
          <img src={FALLBACK_AVATAR} alt="Teacher" />
          <span className={styles.name}>{displayTeacher}</span>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            content="Thông tin"
            onClick={() => {
              dispatch(setCurrentCourse(course));
              navigate(`/course/${id}`);
            }}
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
            onClick={() => dispatch(addToCart(course))} //muốn demo thì dùng dispatch(addItem(course))} nhớ import nha
            containerClassName={styles.actionItem}
            className={`${styles.actionButton} ${styles.cartButton}`}
          />
        </div>
      </div>
    </div>
  );
}
