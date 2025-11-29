// src/pages/JLPT/components/FilterBar.jsx
import React from "react";
import styles from "../JLPTList.module.scss";

const FilterBar = ({
  levelFilter,
  onChangeLevel,
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <section className={styles.filterSection}>
      <div className={styles.filterBox}>
        {/* Lọc cấp độ */}
        <div className={styles.levelFilter}>
          <label>Cấp độ JLPT:</label>
          <select
            value={levelFilter}
            onChange={(e) => onChangeLevel(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="N1">N1</option>
            <option value="N2">N2</option>
            <option value="N3">N3</option>
            <option value="N4">N4</option>
            <option value="N5">N5</option>
          </select>
        </div>

        {/* Ô tìm kiếm */}
        <div className={styles.searchWrap}>
          <i className="fa-solid fa-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm tên đợt thi JLPT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
};

export default FilterBar;
