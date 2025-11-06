import React from "react";
import styles from "./CourseCard.module.scss";
import { Button } from "../../../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { addItem } from "../../../../redux/features/cartSlice";

const FALLBACK_IMAGE =
  "https://thumbs.dreamstime.com/b/teacher-icon-vector-male-person-profile-avatar-book-teaching-school-college-university-education-glyph-113755262.jpg";

export default function CourseCard({ course }) {
  const {
    id,
    title,
    level,
    price,
    rating,
    ratingCount,
    students,
    teacher,
    teacherName,
    teacherAvatar,
    tags = [],
  } = course;

  const displayTeacher = teacherName || teacher || "Đang cập nhật";
  const avatar = teacherAvatar || FALLBACK_IMAGE;
  const displayRatingCount = ratingCount ?? 0;

  const navigate = useNavigate();
  const dispatch = useDispatch();

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
          <span className={styles.price}>
            {price.toLocaleString("vi-VN")} đ
          </span>
        </div>

        <div className={styles.stats}>
          <span>Từ {rating}</span>
          <span className={styles.muted}>({displayRatingCount})</span>
          {students && (
            <span className={styles.muted}>{students} học viên</span>
          )}
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
            content="Xem chi tiết khóa học"
            onClick={() => navigate(`/course/${id}`)}
            containerClassName={styles.actionItem}
            className={styles.actionButton}
          />

          <Button
            content={
              <>
                <FaShoppingCart style={{ marginRight: "6px" }} />
                Thêm vào giỏ hàng
              </>
            }
            onClick={() => dispatch(addItem(course))}
            containerClassName={styles.actionItem}
            className={`${styles.actionButton} ${styles.cartButton}`}
          />
        </div>
      </div>
    </div>
  );
}
