import React from "react";
import styles from "./CartItem.module.scss";
import { FaTrashAlt, FaHeart } from "react-icons/fa";

const CartItem = ({ course, onRemove, onSave, onFavorite }) => {
  return (
    <div className={styles.item}>
      <div className={styles.thumbnail}>Course Thumbnail</div>

      <div className={styles.info}>
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

        <p className={styles.teacher}>Bởi {course.teacher}</p>

        <div className={styles.meta}>
          <span>{course.level}</span>
          <span>{course.lessons} bài học</span>
          <span>{course.duration}</span>
        </div>

        <div className={styles.bottom}>
          <div className={styles.price}>
            <span className={styles.current}>
              ₫{course.price.toLocaleString()}
            </span>
            {course.oldPrice && (
              <>
                <span className={styles.old}>
                  ₫{course.oldPrice.toLocaleString()}
                </span>
                <span className={styles.discount}>{course.discount}</span>
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
