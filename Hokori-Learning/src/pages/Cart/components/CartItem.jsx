import React from "react";
import styles from "./CartItem.module.scss";
import { FaTrashAlt, FaHeart } from "react-icons/fa";

const CartItem = ({ course, onRemove, onSave, onFavorite }) => {
  if (!course) return null; // bảo vệ tránh lỗi nếu course undefined

  return (
    <div className={styles.item}>
      {/* Ảnh hoặc thumbnail khóa học */}
      <div className={styles.thumbnail}>Course Thumbnail</div>

      <div className={styles.info}>
        {/* ===== PHẦN TRÊN: Tên + nút xóa ===== */}
        <div className={styles.top}>
          <h3>{course.title}</h3>
          <button
            className={styles.delete}
            onClick={() => onRemove(course.id)}
            title="Xóa khỏi giỏ hàng"
          >
            <FaTrashAlt />
          </button>
        </div>

        {/* ===== GIẢNG VIÊN (đã fix lỗi render object) ===== */}
        <div className={styles.teacher}>
          {/* Nếu có avatar thì hiển thị */}
          {course.teacher?.avatar && (
            <img
              src={course.teacher.avatar}
              alt={course.teacher.name || "Giảng viên"}
              className={styles.teacherAvatar}
            />
          )}

          <div className={styles.teacherInfo}>
            <p className={styles.teacherName}>
              Bởi {course.teacher?.name || "Giảng viên"}
            </p>
            {course.teacher?.role && (
              <span className={styles.teacherRole}>
                {course.teacher.role}
              </span>
            )}
          </div>
        </div>

        {/* ===== THÔNG TIN KHÓA HỌC ===== */}
        <div className={styles.meta}>
          {course.level && <span>{course.level}</span>}
          {course.lessons && <span>{course.lessons} bài học</span>}
          {course.duration && <span>{course.duration}</span>}
        </div>

        {/* ===== GIÁ + NÚT HÀNH ĐỘNG ===== */}
        <div className={styles.bottom}>
          <div className={styles.price}>
            <span className={styles.current}>
              ₫{course.price?.toLocaleString("vi-VN")}
            </span>

            {course.oldPrice && (
              <>
                <span className={styles.old}>
                  ₫{course.oldPrice.toLocaleString("vi-VN")}
                </span>
                {course.discount && (
                  <span className={styles.discount}>
                    {course.discount}
                  </span>
                )}
              </>
            )}
          </div>

          <div className={styles.actions}>
            <button onClick={() => onSave(course.id)}>Lưu để sau</button>
            <button onClick={() => onFavorite(course.id)}>
              <FaHeart /> Yêu thích
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
