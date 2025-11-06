import React from "react";
import styles from "./CartItem.module.scss";
import { FaTrashAlt, FaHeart } from "react-icons/fa";

const CartItem = ({ item, onRemove, onSave, onFavorite }) => {
  if (!item) return null;

  const course = item.course || {}; // backend có field "course"
  const teacher = course.teacher || "Giảng viên";
  const thumbnail =
    course.thumbnail ||
    "https://via.placeholder.com/150x100.png?text=Course+Thumbnail";

  return (
    <div className={styles.item}>
      {/* ===== HÌNH ẢNH KHÓA HỌC ===== */}
      <div className={styles.thumbnail}>
        <img src={thumbnail} alt={course.title || "Khóa học"} />
      </div>

      {/* ===== THÔNG TIN KHÓA HỌC ===== */}
      <div className={styles.info}>
        {/* Phần trên: Tên + nút xóa */}
        <div className={styles.top}>
          <h3>{course.title || "Tên khóa học"}</h3>
          <button
            className={styles.delete}
            onClick={() => onRemove(item.itemId)}
            title="Xóa khỏi giỏ hàng"
          >
            <FaTrashAlt />
          </button>
        </div>

        {/* Giảng viên */}
        <div className={styles.teacher}>
          {course.teacherAvatar && (
            <img
              src={course.teacherAvatar}
              alt={teacher}
              className={styles.teacherAvatar}
            />
          )}
          <div className={styles.teacherInfo}>
            <p className={styles.teacherName}>Bởi {teacher}</p>
          </div>
        </div>

        {/* Meta: cấp độ / thời lượng (nếu có) */}
        <div className={styles.meta}>
          {course.level && <span>{course.level}</span>}
          {course.duration && <span>{course.duration}</span>}
        </div>

        {/* ===== GIÁ + HÀNH ĐỘNG ===== */}
        <div className={styles.bottom}>
          <div className={styles.price}>
            <span className={styles.current}>
              ₫
              {(course.price || item.totalPrice)?.toLocaleString("vi-VN")}
            </span>
            {course.oldPrice && (
              <span className={styles.old}>
                ₫{course.oldPrice.toLocaleString("vi-VN")}
              </span>
            )}
          </div>

          <div className={styles.actions}>
            <button onClick={() => onSave?.(item.itemId)}>Lưu để sau</button>
            <button onClick={() => onFavorite?.(item.itemId)}>
              <FaHeart /> Yêu thích
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
