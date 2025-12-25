// src/pages/Marketplace/components/SortBar.jsx
import React from "react";
import styles from "./SortBar.module.scss";

export default function SortBar({ total, sort, onSort }) {
  return (
    <div className={styles.sortBar}>
      <p className={styles.summary}>
        {total > 0
          ? `${total} khóa học được tìm thấy`
          : "Không tìm thấy khóa học nào"}
      </p>

      <div className={styles.actions}>
        <span className={styles.label}>Sắp xếp theo:</span>
        <select
          className={styles.select}
          value={sort}
          onChange={(e) => onSort(e.target.value)}
        >
          <option value="Mới nhất">Mới nhất</option>
          <option value="Phổ biến">Phổ biến</option>
          <option value="Giá tăng">Giá: Thấp đến Cao</option>
          <option value="Giá giảm">Giá: Cao đến Thấp</option>
          <option value="Miễn phí">Khóa học Miễn phí</option>
          <option value="Đánh giá cao">Đánh giá cao</option>
        </select>
      </div>
    </div>
  );
}