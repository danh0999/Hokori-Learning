import React from "react";
import styles from "./CartItem.module.scss";
import { FaTrashAlt } from "react-icons/fa";

const CartItem = ({ course, cartItemId, onRemove }) => {
  if (!course) return null;

  return (
    <div className={styles.item}>
      {/* Thumbnail */}
      <div className={styles.thumbnail}>Course Thumbnail</div>

      {/* Info */}
      <div className={styles.info}>
        
        {/* ===== Header: Title + Delete ===== */}
        <div className={styles.headerRow}>
          <h3 className={styles.title}>{course.title}</h3>

          <button
            className={styles.delete}
            onClick={() => onRemove(cartItemId)}
            title="Xóa khỏi giỏ hàng"
          >
            <FaTrashAlt />
          </button>
        </div>

        {/* Teacher */}
        <div className={styles.teacher}>
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
              <span className={styles.teacherRole}>{course.teacher.role}</span>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className={styles.meta}>
          {course.level && <span>{course.level}</span>}
          {course.lessons && <span>{course.lessons} bài học</span>}
          {course.duration && <span>{course.duration}</span>}
        </div>

        {/* Price area */}
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
                  <span className={styles.discount}>{course.discount}</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
