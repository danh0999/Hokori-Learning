import React from "react";
import styles from "../JLPTList.module.scss";

const FilterBar = ({ filterLevel, setFilterLevel, searchTerm, setSearchTerm }) => {
  return (
    <section className={styles.filterSection}>
      <div className={styles.filterBox}>
        <div className={styles.levelFilter}>
          <label>Cấp độ:</label>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option>Tất cả cấp độ</option>
            <option>N1</option>
            <option>N2</option>
            <option>N3</option>
            <option>N4</option>
            <option>N5</option>
          </select>
        </div>

        <div className={styles.searchWrap}>
          <i className="fa-solid fa-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm tên đề thi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
};

export default FilterBar;
