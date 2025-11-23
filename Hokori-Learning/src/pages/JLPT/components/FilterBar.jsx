import React from "react";
import styles from "../JLPTList.module.scss";

const FilterBar = ({ levelFilter, onChangeLevel, searchTerm, setSearchTerm }) => {
  return (
    <section className={styles.filterSection}>
      <div className={styles.filterBox}>
        <div className={styles.levelFilter}>
          <label>Cấp độ:</label>
          <select
            value={levelFilter}
            onChange={(e) => onChangeLevel(e.target.value)}
          >
            <option value="">Tất cả cấp độ</option>
            <option value="N1">N1</option>
            <option value="N2">N2</option>
            <option value="N3">N3</option>
            <option value="N4">N4</option>
            <option value="N5">N5</option>
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
