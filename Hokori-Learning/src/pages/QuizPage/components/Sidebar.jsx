import React from "react";
import styles from "./Sidebar.module.scss";

const Sidebar = ({ total = 10, current = 1 }) => {
  return (
    <div className={styles.sidebar}>
      <h3>Danh sách câu hỏi</h3>
      <div className={styles.grid}>
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            className={`${styles.navBtn} ${
              i + 1 === current ? styles.current : ""
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
