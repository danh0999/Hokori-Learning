import React from "react";
import styles from "./Filters.module.scss";
import { Button } from "../../../../components/Button/Button";
import { SearchBar } from "../../../../components/SearchBar/SearchBar";

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const RATING_OPTIONS = [4, 4.5];

export default function Filters({ filters, setFilters, onClear, onApply }) {
  const handleLevelChange = (event) => {
    const { value, checked } = event.target;
    const nextLevels = checked
      ? [...filters.levels, value]
      : filters.levels.filter((item) => item !== value);

    setFilters({ ...filters, levels: nextLevels });
  };

  const handleRatingChange = (event) => {
    const { value, checked } = event.target;
    const ratingValue = Number(value);
    const nextRatings = checked
      ? [...filters.ratings, ratingValue]
      : filters.ratings.filter((item) => item !== ratingValue);

    setFilters({ ...filters, ratings: nextRatings });
  };

  const handleTeacherSearch = (value) => {
    setFilters({ ...filters, teacher: value });
  };

  return (
    <aside className={styles.filters}>
      <h3 className={styles.title}>Bộ lọc</h3>

      <div className={styles.group}>
        <h4>Cấp độ JLPT</h4>
        {JLPT_LEVELS.map((level) => (
          <label key={level} className={styles.row}>
            <input
              type="checkbox"
              value={level}
              checked={filters.levels.includes(level)}
              onChange={handleLevelChange}
            />
            <span>{level}</span>
          </label>
        ))}
      </div>

      <div className={styles.group}>
        <h4>Giá (VND)</h4>
        <input
          type="range"
          min={0}
          max={2000000}
          value={filters.priceMax}
          onChange={(event) =>
            setFilters({ ...filters, priceMax: Number(event.target.value) })
          }
          className={styles.range}
        />
        <div className={styles.rangeRow}>
          <span>0₫</span>
          <span>2.000.000₫</span>
        </div>
      </div>

      <div className={styles.group}>
        <h4>Đánh giá</h4>
        {RATING_OPTIONS.map((rating) => (
          <label key={rating} className={styles.row}>
            <input
              type="checkbox"
              value={rating}
              checked={filters.ratings.includes(rating)}
              onChange={handleRatingChange}
            />
            <span>Từ {rating}+</span>
          </label>
        ))}
      </div>

      <div className={styles.group}>
        <h4>Giáo viên</h4>
        <div className={styles.searchWrap}>
          <SearchBar
            placeholder="Tìm giáo viên..."
            onSearch={handleTeacherSearch}
          />
        </div>
      </div>

      <div className={styles.buttonRow}>
        <Button
          content="Tìm"
          onClick={onApply}
          containerClassName={styles.buttonContainer}
        />
        <Button
          content="Xóa bộ lọc"
          onClick={onClear}
          containerClassName={`${styles.buttonContainer} ${styles.secondary}`}
        />
      </div>
    </aside>
  );
}
