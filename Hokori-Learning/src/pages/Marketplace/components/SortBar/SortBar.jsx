import React from "react";
import styles from "./SortBar.module.scss";

export default function SortBar({ total, sort, onSort }) {
  return (
    <div className={styles.sortBar}>
      <p>Đã tìm thấy {total} khóa học</p>
      <select
        className={styles.select}
        value={sort}
        onChange={(e) => onSort(e.target.value)}
      >
        <option value="Phổ biến">Phổ biến</option>
        <option value="Mới nhất">Mới nhất</option>
        <option value="Giá tăng">Giá tăng</option>
        <option value="Giá giảm">Giá giảm</option>
        <option value="Đánh giá cao">Đánh giá cao</option>
      </select>
    </div>
  );
}
