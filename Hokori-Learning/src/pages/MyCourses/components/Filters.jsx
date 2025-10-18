import React from "react";
import styles from "./Filters.module.scss";

const Filters = () => {
  return (
    <div className={styles.filters}>
      <div className={styles.tabs}>
        <button className={styles.active}>Đang học</button>
        <button>Đã hoàn thành</button>
        <button>Lịch sử mua</button>
        <button>Yêu thích</button>
      </div>

      <div className={styles.controls}>
        <select>
          <option>Tất cả cấp độ</option>
          <option>N5</option>
          <option>N4</option>
          <option>N3</option>
          <option>N2</option>
          <option>N1</option>
        </select>
        <input type="text" placeholder="Tìm kiếm khóa học..." />
      </div>
    </div>
  );
};

export default Filters;
