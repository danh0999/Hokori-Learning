import React from "react";
import styles from "./CourseCard.module.scss";
import { Button } from "../../../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { addToCart } from "../../../../redux/features/cartSlice"; // ✅ dùng API backend
import { message } from "antd";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/300x180.png?text=Hokori+Course";

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  if (!course) return null;

  // ✅ lấy dữ liệu từ props (hoặc mock)
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

  const displayTeacher = teacherName || teacher || "Giảng viên";
  const avatar = teacherAvatar || FALLBACK_IMAGE;
  const displayRatingCount = ratingCount ?? 0;

  // ======================
  // 🛒 Hàm thêm vào giỏ hàng
  // ======================
  const handleAddToCart = async () => {
    try {
      // Gọi Redux thunk addToCart (đã kết nối API /api/cart/items)
      await dispatch(addToCart(id)).unwrap();

      // ✅ Hiển thị toast
      message.success("Đã thêm khóa học vào giỏ hàng!");
    } catch (error) {
      console.error("Add to cart failed:", error);
      message.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại!");
    }
  };

  // ======================
  // 🧭 Hàm điều hướng chi tiết khóa học
  // ======================
  const handleViewDetail = () => {
    navigate(`/course/${id}`);
  };

  // ======================
  // 🖼️ Render giao diện
  // ======================
  return (
    <div className={styles.card}>
      {/* Ảnh thumbnail */}
      <div className={styles.thumb}>
        <img
          src={course.thumbnail || FALLBACK_IMAGE}
          alt={title}
          loading="lazy"
        />
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>

        {/* Giảng viên */}
        <div className={styles.teacher}>
          <img src={avatar} alt={displayTeacher} />
          <span className={styles.name}>{displayTeacher}</span>
        </div>

        {/* Thông tin meta */}
        <div className={styles.meta}>
          <span className={styles.badge}>{level}</span>
          <span className={styles.price}>
            {price?.toLocaleString("vi-VN")} đ
          </span>
        </div>

        {/* Đánh giá */}
        <div className={styles.stats}>
          <span>⭐ {rating}</span>
          <span className={styles.muted}>({displayRatingCount})</span>
          {students && (
            <span className={styles.muted}>{students} học viên</span>
          )}
        </div>

        {/* Tag (nếu có) */}
        {tags.length > 0 && (
          <div className={styles.chips}>
            {tags.map((chip) => (
              <span key={chip} className={styles.chip}>
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Nút hành động */}
        <div className={styles.actions}>
          <Button
            content="Xem chi tiết"
            onClick={handleViewDetail}
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
            onClick={handleAddToCart}
            containerClassName={styles.actionItem}
            className={`${styles.actionButton} ${styles.cartButton}`}
          />
        </div>
      </div>
    </div>
  );
}
