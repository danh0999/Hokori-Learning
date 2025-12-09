// src/pages/Cart/components/CartItem.jsx
import React from "react";
import styles from "./CartItem.module.scss";
import { FaTrashAlt } from "react-icons/fa";

const CartItem = ({ course, cartItemId, onRemove }) => {
  if (!course) return null;

  const teacherName =
    course.teacher?.name || course.teacherName || "Giảng viên";
  const thumbnail = course.thumbnail || course.image || null;

  return (
    <article className={styles.item}>
      {/* Thumbnail */}
      <div className={styles.thumbnail}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={course.title}
            className={styles.thumbImage}
          />
        ) : (
          <div className={styles.thumbPlaceholder}>
            <span>JP</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={styles.info}>
        {/* Title + delete */}
        <div className={styles.headerRow}>
          <h3 className={styles.title}>{course.title}</h3>

          <button
            className={styles.delete}
            onClick={() => onRemove(cartItemId)}
            title="Xóa khỏi giỏ hàng"
            type="button"
          >
            <FaTrashAlt />
          </button>
        </div>

        {/* Teacher */}
        <div className={styles.teacher}>
          {/* <div className={styles.teacherAvatar}>
            {teacherName?.[0]?.toUpperCase() || "T"}
          </div> */}
          <div className={styles.teacherInfo}>
            <p className={styles.teacherName}>Bởi {teacherName}</p>
          </div>
        </div>

        {/* Meta (optional info) */}
        <div className={styles.meta}>
          {course.level && <span>{course.level}</span>}
          {course.lessons && <span>{course.lessons} bài học</span>}
          {course.duration && <span>{course.duration}</span>}
        </div>

        {/* Price */}
        <div className={styles.bottom}>
          <div className={styles.price}>
            <span className={styles.current}>
              ₫{Number(course.price || 0).toLocaleString("vi-VN")}
            </span>

            {course.oldPrice && (
              <>
                <span className={styles.old}>
                  ₫{Number(course.oldPrice).toLocaleString("vi-VN")}
                </span>
                {course.discount && (
                  <span className={styles.discount}>{course.discount}</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default CartItem;
